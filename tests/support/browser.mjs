import {existsSync} from 'node:fs';
export function browserOptions(){const edge='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';return {headless:true,...(process.env.PW_CHANNEL!=='chromium'&&process.platform==='win32'&&existsSync(edge)?{executablePath:edge}:{})}}
