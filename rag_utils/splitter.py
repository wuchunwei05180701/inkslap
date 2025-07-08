class Document:
    def __init__(self, page_content: str, metadata: dict[str, any] = None):
        self.page_content = page_content
        self.metadata = metadata or {}

    def __repr__(self) -> str:
        return f"Document({self.page_content!r}, metadata={self.metadata!r})"


class CharacterTextSplitter:
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 0):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def split_text(self, text: str, metadata: dict[str, any] = None) -> list[Document]:
        metadata = metadata or {}
        documents = []
        for i in range(0, len(text), self.chunk_size - self.chunk_overlap):
            chunk = text[i:i + self.chunk_size]
            documents.append(Document(page_content=chunk, metadata=metadata))
        return documents


class RecursiveCharacterTextSplitter(CharacterTextSplitter):
    def __init__(self, separators: list[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.separators = separators or ["\n\n", "\n", "。", "，", ",", " ", ""]

    def _split_text(self, text: str, metadata: dict[str, any] = None, separators: list[str] = None) -> list[Document]:
        metadata = metadata or {}

        if len(text) <= self.chunk_size:
            return [Document(page_content=text, metadata=metadata)]

        if not separators:
            return [
                Document(page_content=text[i:i + self.chunk_size], metadata=metadata)
                for i in range(0, len(text), self.chunk_size - self.chunk_overlap)
            ]

        sep = separators[0]

        if sep == "":
            return [
                Document(page_content=text[i:i + self.chunk_size], metadata=metadata)
                for i in range(0, len(text), self.chunk_size - self.chunk_overlap)
            ]

        parts = text.split(sep)
        if len(parts) == 1:
            return self._split_text(text, metadata, separators[1:])

        # 粗略分段
        rough_chunks = []
        current_chunk = ""

        for idx, part in enumerate(parts):
            append_sep = sep if idx < len(parts) - 1 else ""
            if len(current_chunk) + len(part) + len(append_sep) <= self.chunk_size:
                current_chunk += part + append_sep
            else:
                if current_chunk:
                    rough_chunks.append(current_chunk.strip())
                current_chunk = part + append_sep
        if current_chunk:
            rough_chunks.append(current_chunk.strip())

        # 將所有 rough_chunks 串接成大字串再滑動切分
        joined = "".join(rough_chunks)
        final_chunks = []
        step = self.chunk_size - self.chunk_overlap
        for i in range(0, len(joined), step):
            final_chunks.append(Document(page_content=joined[i:i + self.chunk_size], metadata=metadata))

        return final_chunks


    def split_text(self, text: str, metadata: dict[str, any] = None) -> list[Document]:
        return self._split_text(text, metadata, self.separators)
