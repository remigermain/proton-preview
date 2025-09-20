// ==UserScript==
// @name         proton.preview
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

    /*
      Response interceptor here
    */

    // frontend permission
    if (response.url.includes("proton.me/api/feature/v2/frontend")) {
      const res = response.clone()
      res.json = proxyMethod(res.json, (data) => {

        // remove permission for not duplicate rules
        const removePermssions = new Set(["DocsSheetsDisabled", "DocsSheetsEnabled", "MeetEarlyAccess"])
        data.toggles = data.toggles.filter((el) => !removePermssions.has(el.name))

        // enable proton-sheet
        // enable proton-meet preview
        data.toggles.push({
          "name": "DocsSheetsDisabled",
          "enabled": false,
          "impressionData": false,
          "variant": {
            "name": "disabled",
            "enabled": false
          }
        }, {
          "name": "DocsSheetsEnabled",
          "enabled": true,
          "impressionData": false,
          "variant": {
            "name": "disabled",
            "enabled": false
          }
        },{
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
    if (response.url.includes("meet.proton.me/api/meet/v1/meetings/active") && response.status === 404) {
      const res = response.clone()
      res.json = async () => ({ Meetings: [] })
      return proxyProperty(res, { status: 200 })
    }

    // return default reponse
    return response;
  }
})();
