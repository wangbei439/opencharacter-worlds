import {chromium} from 'playwright';
import {browserOptions} from '../support/browser.mjs';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const zh=JSON.parse(await fs.readFile('locales/zh-CN/common.json','utf8'));
const browser=await chromium.launch(browserOptions());
try {
 const page=await browser.newPage();let calls=0;
 await page.route('https://fixture.example.test/**',async route=>{calls++;const body=route.request().postDataJSON();assert.equal(route.request().headers().authorization,'Bearer fixture-only');if(!body){await route.fulfill({contentType:'application/json',body:JSON.stringify({data:[]})});return}if(body.stream)await route.fulfill({contentType:'text/event-stream',body:'data: '+JSON.stringify({choices:[{delta:{content:'I accept the silver ring.'}}]})+'\n\ndata: '+JSON.stringify({choices:[{delta:{},finish_reason:'stop'}]})+'\n\ndata: [DONE]\n\n'});else await route.fulfill({contentType:'application/json',body:JSON.stringify({choices:[{message:{content:'{"decision":"ACCEPT"}'}}]})})});
 await page.goto('http://127.0.0.1:4173/');await page.getByRole('button',{name:zh['landing.example'],exact:true}).click();await page.locator('.import-preview button').click();await page.locator('.provider-form select').first().selectOption('custom');await page.locator('.provider-form input[type=url]').fill('https://fixture.example.test/v1');await page.locator('input[list=provider-models]').fill('fixture-model');await page.locator('.provider-form input[type=password]').fill('fixture-only');await page.locator('.provider-form button[type=submit]').click();
 await page.locator('.enter-world').waitFor();calls=0;await page.goto('http://127.0.0.1:4173/?live-check');await page.getByRole('button').first().click();await page.waitForFunction(()=>{try{return JSON.parse(document.querySelector('pre').textContent).status==='completed'}catch{return false}});
 const report=JSON.parse(await page.locator('pre').innerText());assert.equal(report.rows.length,9);assert.ok(report.calls<=12);assert.equal(report.rows[2].ringOwner,'keeper');assert.equal(report.rows[5].ringOwner,'shen');assert.equal(report.rows[5].herbsOwner,'ye');assert.ok(report.rows.every(r=>!r.hiddenInformationInContext));assert.ok(!JSON.stringify(report).includes('fixture-only'));assert.equal(report.rows[8].events.length,0);console.log('Multi-card runner: 9 turns, ownership, isolation, secret exclusion and request bound verified with intercepted responses; NOT a live API result.');
}finally{await browser.close()}
