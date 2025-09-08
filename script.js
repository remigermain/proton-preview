// ==UserScript==
// @name         proton.sheet
// @namespace    http://tampermonkey.net/
// @version      2025-09-08
// @description  proton more sheet
// @match        https://*.proton.me/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  function proxyMethod(ori, callback) {
    return new Proxy(ori, {
      apply: (target, thisArg, arg) => {
        return target.apply(thisArg, ...arg).then(callback)
      }
    })
  }

  function proxyProperty(ori, obj) {
    return new Proxy(ori, {
      get: (target, prop, receiver) => {
        if (obj.hasOwnProperty(prop)) {
          return obj[prop]
        }
        return Reflect.get(target, prop)
      }
    })
  }

  const originalFetch = window.fetch;
  window.fetch = async (resource, config) => {
    // request interceptor here
    const response = await originalFetch(resource, config);

    // -- response interceptor here

    //
    if (response.url.includes("proton.me/api/feature/v2/frontend")) {
      const res = response.clone()
      res.json = proxyMethod(res.json, (data) => {

        // enable proton-sheet
        data.toggles.push({
          "name": "DocsSheetsDisabled",
          "enabled": false,
          "impressionData": false,
          "variant": {
            "name": "disabled",
            "enabled": false
          }
        })
        data.toggles.push({
          "name": "DocsSheetsEnabled",
          "enabled": true,
          "impressionData": false,
          "variant": {
            "name": "disabled",
            "enabled": false
          }
        })

        // enable meet preview
        data.toggles.push({
          "name": "MeetEarlyAccess",
          "enabled": true,
          "impressionData": false,
          "variant": {
            "name": "disabled",
            "enabled": false
          }
        })
        return data
      })
      return res
    }
    // fake response from gettings meetings (return empty list)
    if (response.url.includes("meet.proton.me/api/meet/v1/meetings/active")) {
      const res = response.clone()
      res.json = async () => ({ Meetings: [] })
      return proxyProperty(res, { status: 200 })
    }
    return response;
  }
})();