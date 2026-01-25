/**
 * CrawledImageEntry value object - represents an image found on a web page
 */
export interface CrawledImageEntry {
  /** Index of the entry in the crawl result */
  index: number;
  /** Full URL of the image */
  url: string;
  /** File name extracted from URL */
  filename: string;
  /** Alt text if available */
  alt?: string;
}
