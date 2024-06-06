export interface ImageJson {
  url: string;
  width: number;
}

export interface Image {
  og: ImageJson;
  sm: ImageJson;
  md: ImageJson;
  lg: ImageJson;
  xl: ImageJson;
}

interface ProductDto {
  basePrice: number;
  description: string;
  displayPrice: string;
  name: string;
  productId: number;
  productType: string;
  productUuid: string;
  hasVariants: boolean;
  images: Image;
}

export default ProductDto;
