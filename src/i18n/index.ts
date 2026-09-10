import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import zh from '../../locales/zh-CN/common.json';
import en from '../../locales/en-US/common.json';
void i18n.use(initReactI18next).init({lng:'zh-CN',fallbackLng:'en-US',keySeparator:false,resources:{'zh-CN':{translation:zh},'en-US':{translation:en}},interpolation:{escapeValue:false}});
export default i18n;
