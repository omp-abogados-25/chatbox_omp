import { ToWords } from 'to-words';

/**
 * @constant COP_CURRENCY_CONFIG
 * @description Configuración de moneda para pesos colombianos (COP) utilizada por `toWordsConverter`.
 *              Define el nombre singular y plural de la moneda, su símbolo y la unidad fraccionaria.
 */
export const COP_CURRENCY_CONFIG = {
  name: 'peso',
  plural: 'pesos',
  symbol: '$',
  fractionalUnit: { name: 'centavo', plural: 'centavos', symbol: '¢' }
};

/**
 * @constant toWordsConverter
 * @description Instancia del convertidor de números a palabras (ToWords), configurado para español (es-ES)
 *              y formateo de moneda en pesos colombianos (COP) utilizando `COP_CURRENCY_CONFIG`.
 *
 * @example
 * // import { toWordsConverter } from './config/to-words.config';
 * // toWordsConverter.convert(1500000); // Retorna: "Un millón quinientos mil pesos"
 */
export const toWordsConverter = new ToWords({
  localeCode: 'es-ES',
  converterOptions: {
    currency: true,
    currencyOptions: COP_CURRENCY_CONFIG
  }
}); 