import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';
import {BRAND} from './src/app/brand.ts';
export default defineConfig({
 plugins:[{name:'app-brand',transformIndexHtml:html=>html.replace('<!--app-title-->',BRAND.name)},VitePWA({registerType:'prompt',includeAssets:['icon.svg','icon-192.png','icon-512.png'],manifest:{name:BRAND.name,short_name:BRAND.shortName,start_url:'/',scope:'/',display:'standalone',theme_color:'#101715',background_color:'#101715',icons:[{src:'/icon-192.png',sizes:'192x192',type:'image/png'},{src:'/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any maskable'}]},workbox:{maximumFileSizeToCacheInBytes:12*1024*1024,globPatterns:['**/*.{js,css,html,json,svg,png}'],runtimeCaching:[],navigateFallbackDenylist:[/^\/api\//]}})],
 build:{target:'es2022'},
});
