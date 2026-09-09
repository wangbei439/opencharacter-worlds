import React from 'react';
import {createRoot} from 'react-dom/client';
import i18n from 'i18next';
import {initReactI18next,useTranslation} from 'react-i18next';
import zh from '../../locales/zh-CN/common.json';
import en from '../../locales/en-US/common.json';
await i18n.use(initReactI18next).init({lng:'zh-CN',fallbackLng:'en-US',resources:{'zh-CN':{translation:zh},'en-US':{translation:en}},interpolation:{escapeValue:false}});
document.documentElement.lang=i18n.language;
function Preparation(){const {t}=useTranslation();return <main><h1>{t('preparation.title')}</h1><p>{t('preparation.note')}</p></main>}
createRoot(document.getElementById('root')!).render(<Preparation/>);
