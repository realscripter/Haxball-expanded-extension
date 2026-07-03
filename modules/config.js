// ─── SHARED CONFIG & STATE ────────────────────────────────────────────────────
'use strict';

const SIGNATURE     = '\u200B\u200C\u200D';
const SIG_RE        = /[\u200B\u200C\u200D]+/g;
const API_PORT      = 3001;
const CLIENT_VER    = '0.13';

let isSubmitting       = false;
let cachedLiveTitle    = null;
let isExpandedRoom     = false;
let lastAppliedTitle   = null;
let cachedVersion      = CLIENT_VER;
let cachedApiData      = null;   // full last API response
