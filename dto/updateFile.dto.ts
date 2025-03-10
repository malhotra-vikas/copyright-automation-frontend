export interface UpdateFileDto {
  _id: string;
  originalName?: string;

  docType?: string;
  useFull?: string;
  extractedTextSummary?: string;
  extractedTextHeadline?: string;
  extractedCeoQuote?: string;
}
