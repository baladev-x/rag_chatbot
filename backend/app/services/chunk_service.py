def chunk_text(
    text: str,
    chunk_size: int = 1000,
    overlap: int = 200
) -> list[dict]:

    if not text.strip():

        return []


    if overlap >= chunk_size:

        raise ValueError(
            "overlap must be smaller than chunk_size"
        )


    chunks = []

    start = 0

    text_length = len(text)

    chunk_index = 0


    while start < text_length:

        end = start + chunk_size

        chunk = text[
            start:end
        ].strip()


        if chunk:

            chunks.append({

                "text": chunk,

                "chunk_index": chunk_index
            })


            chunk_index += 1


        start += (
            chunk_size - overlap
        )


    return chunks


# --------------------------------------------------
# PDF chunks
# --------------------------------------------------

def chunk_pdf_pages(
    pages: list[dict],
    chunk_size: int = 1000,
    overlap: int = 200
) -> list[dict]:

    all_chunks = []

    chunk_index = 0


    if overlap >= chunk_size:

        raise ValueError(
            "overlap must be smaller than chunk_size"
        )


    for page in pages:

        page_text = page["text"]

        page_number = page[
            "page_number"
        ]


        if not page_text.strip():

            continue


        start = 0

        text_length = len(page_text)


        while start < text_length:

            end = start + chunk_size

            chunk = page_text[
                start:end
            ].strip()


            if chunk:

                all_chunks.append({

                    "text": chunk,

                    "chunk_index": chunk_index,

                    "page_number": page_number
                })


                chunk_index += 1


            start += (
                chunk_size - overlap
            )


    return all_chunks