export type GoogleAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

export type Location = {
  lat: number;
  lng: number;
};

export type Viewport = {
  south: number;
  west: number;
  north: number;
  east: number;
};
export interface IGeometry {
  location: Location;
  viewport: Viewport;
}

export interface IGooglePlace {
  address_components: GoogleAddressComponent[];
  adr_address: string;
  formatted_address: string;
  geometry: IGeometry;
  icon: string;
  icon_background_color: string;
  icon_mask_base_uri: string;
  name: string;
  place_id: string;
  reference: string;
  types: string[];
  url: string;
  utc_offset: number;
  vicinity: string;
  html_attributions: any[];
  utc_offset_minutes: number;
}
