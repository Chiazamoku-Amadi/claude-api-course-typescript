type DistanceMetric = "cosine" | "euclidean";

export interface VectorDocument {
  content: string;
  [key: string]: unknown;
}

type EmbeddingFn = (text: string) => Promise<number[]> | number[];

export class VectorIndex {
  private vectors: number[][] = [];
  private documents: VectorDocument[] = [];
  private vectorDim: number | null = null;
  private distanceMetric: DistanceMetric;
  private embeddingFn: EmbeddingFn | undefined;

  constructor(
    distanceMetric: DistanceMetric = "cosine",
    embeddingFn?: EmbeddingFn,
  ) {
    if (distanceMetric !== "cosine" && distanceMetric !== "euclidean") {
      throw new Error("distanceMetric must be 'cosine' or 'euclidean'");
    }
    this.distanceMetric = distanceMetric;
    this.embeddingFn = embeddingFn;
  }

  async addDocument(document: VectorDocument): Promise<void> {
    if (!this.embeddingFn) {
      throw new Error("Embedding function not provided during initialization.");
    }
    if (typeof document !== "object" || document === null) {
      throw new TypeError("Document must be an object.");
    }
    if (!("content" in document)) {
      throw new Error("Document object must contain a 'content' key.");
    }

    const content = document.content;
    if (typeof content !== "string") {
      throw new TypeError("Document 'content' must be a string.");
    }

    const vector = await this.embeddingFn(content);
    this.addVector(vector, document);
  }

  async search(
    query: string | number[],
    k = 1,
  ): Promise<Array<[VectorDocument, number]>> {
    if (this.vectors.length === 0) {
      return [];
    }

    let queryVector: number[];

    if (typeof query === "string") {
      if (!this.embeddingFn) {
        throw new Error("Embedding function not provided for string query.");
      }
      queryVector = await this.embeddingFn(query);
    } else if (
      Array.isArray(query) &&
      query.every((x) => typeof x === "number")
    ) {
      queryVector = query;
    } else {
      throw new TypeError(
        "Query must be either a string or an array of numbers.",
      );
    }

    if (this.vectorDim === null) {
      return [];
    }

    if (queryVector.length !== this.vectorDim) {
      throw new Error(
        `Query vector dimension mismatch. Expected ${this.vectorDim}, got ${queryVector.length}`,
      );
    }

    if (k <= 0) {
      throw new Error("k must be a positive integer.");
    }

    const distFunc =
      this.distanceMetric === "cosine"
        ? this.cosineDistance.bind(this)
        : this.euclideanDistance.bind(this);

    const distances: Array<[number, VectorDocument]> = this.vectors.map(
      (storedVector, i) => [
        distFunc(queryVector, storedVector),
        this.documents[i]!,
      ],
    );

    distances.sort((a, b) => a[0] - b[0]);

    return distances.slice(0, k).map(([dist, doc]) => [doc, dist]);
  }

  addVector(vector: number[], document: VectorDocument): void {
    if (!Array.isArray(vector) || !vector.every((x) => typeof x === "number")) {
      throw new TypeError("Vector must be an array of numbers.");
    }
    if (typeof document !== "object" || document === null) {
      throw new TypeError("Document must be an object.");
    }
    if (!("content" in document)) {
      throw new Error("Document object must contain a 'content' key.");
    }

    if (this.vectors.length === 0) {
      this.vectorDim = vector.length;
    } else if (vector.length !== this.vectorDim) {
      throw new Error(
        `Inconsistent vector dimension. Expected ${this.vectorDim}, got ${vector.length}`,
      );
    }

    this.vectors.push([...vector]);
    this.documents.push(document);
  }

  private euclideanDistance(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error("Vectors must have the same dimension");
    }
    return Math.sqrt(vec1.reduce((sum, p, i) => sum + (p - vec2[i]!) ** 2, 0));
  }

  private dotProduct(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error("Vectors must have the same dimension");
    }
    return vec1.reduce((sum, p, i) => sum + p * vec2[i]!, 0);
  }

  private magnitude(vec: number[]): number {
    return Math.sqrt(vec.reduce((sum, x) => sum + x * x, 0));
  }

  private cosineDistance(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error("Vectors must have the same dimension");
    }

    const mag1 = this.magnitude(vec1);
    const mag2 = this.magnitude(vec2);

    if (mag1 === 0 && mag2 === 0) return 0.0;
    if (mag1 === 0 || mag2 === 0) return 1.0;

    const dotProd = this.dotProduct(vec1, vec2);
    let cosineSimilarity = dotProd / (mag1 * mag2);
    cosineSimilarity = Math.max(-1.0, Math.min(1.0, cosineSimilarity));

    return 1.0 - cosineSimilarity;
  }

  get length(): number {
    return this.vectors.length;
  }

  toString(): string {
    const hasEmbedFn = this.embeddingFn ? "Yes" : "No";
    return `VectorIndex(count=${this.length}, dim=${this.vectorDim}, metric='${this.distanceMetric}', hasEmbeddingFn='${hasEmbedFn}')`;
  }
}
