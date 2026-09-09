import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';
export default defineConfig({
 plugins:[VitePWA({registerType:'prompt',manifest:{name:'OpenCharacter Worlds',short_name:'OC Worlds',start_url:'/',display:'standalone',theme_color:'#17202a',background_color:'#ffffff'},workbox:{globPatterns:['**/*.{js,css,html,json,svg,png}'],runtimeCaching:[]}})],
 build:{target:'es2022'},
});
