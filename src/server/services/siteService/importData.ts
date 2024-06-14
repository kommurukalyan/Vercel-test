import ModifierService from '../modifierService';
import OptionService from '../optionService';
import ProductService from '../productService';

export const addOptions = async (
  options: any,
  optionCollectionId: any,
  apiKey: any,
  siteId: any,
) => {
  console.log('entered options');
  for (let i = 0; i < options.length; i++) {
    const ele = options[i];
    await new Promise<void>((resolve) => {
      setTimeout(async () => {
        await OptionService.create(
          apiKey as string,
          optionCollectionId,
          ele,
          siteId,
        );
        resolve();
      }, i * 1000);
    });
  }
  return true;
};

export const addModifiers = async (
  modifiers: any,
  modifierCollectionId: any,
  apiKey: any,
  siteId: any,
) => {
  console.log('entered modifiers');
  for (let i = 0; i < modifiers.length; i++) {
    const ele = modifiers[i];
    await new Promise<void>((resolve) => {
      setTimeout(async () => {
        await ModifierService.create(
          apiKey as string,
          modifierCollectionId,
          ele,
          siteId,
        );
        resolve();
      }, i * 1000);
    });
  }
  return true;
};

export const addProducts = async (
  products: any,
  productCollectionId: any,
  apiKey: any,
  siteId: any,
) => {
  console.log('entered products');
  for (let i = 0; i < products.length; i++) {
    const ele = products[i];
    await new Promise<void>((resolve) => {
      setTimeout(async () => {
        await ProductService.create(
          apiKey as string,
          productCollectionId,
          ele,
          siteId,
        );
        resolve();
      }, i * 1000);
    });
  }
  return true;
};
export const importData = async (
  options: any,
  modifiers: any,
  products: any,
  optionCollectionId: any,
  modifierCollectionId: any,
  productCollectionId: any,
  apiKey: any,
  siteId: any,
) => {
  console.log('options', options.length);
  const optionsData = await addOptions(
    options,
    optionCollectionId,
    apiKey,
    siteId,
  );

  if (optionsData) {
    console.log('modifiers', modifiers.length);
    const modifiersData = await addModifiers(
      modifiers,
      modifierCollectionId,
      apiKey,
      siteId,
    );
    if (modifiersData) {
      console.log('products', products.length);
      const productsData = await addProducts(
        products,
        productCollectionId,
        apiKey,
        siteId,
      );
      if (productsData) {
        console.log('import success');
      }
    }
  }
};
