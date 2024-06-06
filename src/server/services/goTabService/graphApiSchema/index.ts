export const Location_Schema = `
locationUuid
locationId
name
urlName
available`;
export const Address_Schema = `
addressUuid
city
country
state
street1
zip`;
export const Menu_Schema = `
menuId
enabled
available
menuUuid
 name
 menuHeader
 menuFooter
 archived`;

export const MENU_Category_Schema = `
 menuCategoryId
 label`;

export const Category_Schema = `
 name
 categoryId
 disclaimer
 enabled 
 archived`;

export const Product_Schema = `
 available
 basePrice
 description
 displayPrice
 hasVariants
 images
 name
 productId
 productUuid
 categoryId`;

export const Modifier_Schema = `
 description
 enabled
 key
 name
 price
 rank
 required
 uid`;

export const Variant_Schema = `
 archived
 name
 price
 sku
 `;
export const Option_Schema = `
 description
 enabled
 key
 name
 price
 rank
 required
 uid
 variant
 `;
