import pandas as pd
import psycopg2
from vertexai.language_models import TextEmbeddingModel
from google.cloud import aiplatform
import os
from dotenv import load_dotenv

# --- Load Environment Variables ---
load_dotenv(override=True)

# --- Configuration Variables (from .env) ---
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID")
GCP_REGION = os.getenv("GCP_REGION")

# Path to your dataset file
DATASET_FILE = "papers_demo.csv"

# Embedding Model Name: The specific Vertex AI model to use for embeddings.
EMBEDDING_MODEL_NAME = "text-embedding-004"


# --- Initialize Vertex AI ---
aiplatform.init(project=GCP_PROJECT_ID, location=GCP_REGION)
embedding_model = TextEmbeddingModel.from_pretrained(EMBEDDING_MODEL_NAME)

# --- Embedding Function ---
def get_embedding(text: str) -> list[float]:
    """Generates an embedding for the given text using Vertex AI."""
    if not text or not isinstance(text, str):
        return []
    try:
        response = embedding_model.get_embeddings([text])
        return response[0].values
    except Exception as e:
        print(f"Error generating embedding for text: '{text[:50]}...' - {e}")
        return []

# --- Main Ingestion Logic ---
def ingest_data(df: pd.DataFrame):
    """Ingests DataFrame records into the Cloud SQL papers table."""
    conn = None
    try:
        # Connect to Cloud SQL
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        cur = conn.cursor()
        print("Successfully connected to Cloud SQL.")

        # Prepare the INSERT statement - REMOVED full_text_snippet
        insert_sql = """
        INSERT INTO paper (
            id, title, authors, publication_year, journal_name, abstract,
            doi, url, abstract_embedding
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s::vector)
        ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            authors = EXCLUDED.authors,
            publication_year = EXCLUDED.publication_year,
            journal_name = EXCLUDED.journal_name,
            abstract = EXCLUDED.abstract,
            doi = EXCLUDED.doi,
            url = EXCLUDED.url,
            abstract_embedding = EXCLUDED.abstract_embedding;
        """

        for index, row in df.iterrows():
            paper_id = str(row['id'])
            abstract_text = row['abstract'] if pd.notna(row['abstract']) else ""

            embedding = get_embedding(abstract_text)
            if not embedding:
                print(f"Skipping paper {paper_id} due to embedding error.")
                continue

            # Data to insert - REMOVED full_text_snippet
            data_to_insert = (
                paper_id,
                row['title'] if pd.notna(row['title']) else None,
                row['authors'] if pd.notna(row['authors']) else None,
                row['publication_year'] if pd.notna(row['publication_year']) else None, # Pass the original string
                row['journal_name'] if pd.notna(row['journal_name']) else None,
                abstract_text,
                row['doi'] if pd.notna(row['doi']) else None,
                row['url'] if pd.notna(row['url']) else None,
                embedding
            )

            try:
                cur.execute(insert_sql, data_to_insert)
                print(f"Inserted/Updated paper: {paper_id} - '{row['title']}'")
            except Exception as e:
                print(f"Error inserting paper {paper_id}: {e}")
                conn.rollback()
                continue

        conn.commit()
        print("Data ingestion complete!")

    except psycopg2.Error as e:
        print(f"Database connection or operation error: {e}")
    finally:
        if conn:
            cur.close()
        if conn:
            conn.close()
        print("Database connection closed.")

# --- Run the Ingestion ---
if __name__ == "__main__":
    print(f"Starting data ingestion from {DATASET_FILE}...")

    if DATASET_FILE.endswith(".csv"):
        papers_df = pd.read_csv(DATASET_FILE)
    elif DATASET_FILE.endswith(".json"):
        papers_df = pd.read_json(DATASET_FILE)
    else:
        raise ValueError("Unsupported DATASET_FILE type. Must be .csv or .json")

    print(f"Loaded {len(papers_df)} records from {DATASET_FILE}.")
    # ingest_data(papers_df)

        # --- MODIFICATION START ---
    # Define the starting row (0-indexed). If you want to start from paper ID 12, that's row index 11.
    start_row_index = 24

    # Check if the DataFrame has enough rows to start from the specified index
    if len(papers_df) > start_row_index:
        papers_df_subset = papers_df.iloc[start_row_index:].copy()
        print(f"Processing a subset of {len(papers_df_subset)} records, starting from row {start_row_index + 1}.")
        ingest_data(papers_df_subset)
    else:
        print(f"DataFrame has only {len(papers_df)} rows. No rows to process from index {start_row_index}.")
    # --- MODIFICATION END ---