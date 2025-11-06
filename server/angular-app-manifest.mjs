
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: 'https://kido-kid.github.io/NoteApp/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "redirectTo": "/NoteApp/login",
    "route": "/NoteApp"
  },
  {
    "renderMode": 2,
    "route": "/NoteApp/login"
  },
  {
    "renderMode": 2,
    "route": "/NoteApp/signup"
  },
  {
    "renderMode": 2,
    "route": "/NoteApp/notes"
  },
  {
    "renderMode": 2,
    "redirectTo": "/NoteApp/login",
    "route": "/NoteApp/**"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 653, hash: '4da43aeb82c43318409b7d9320c503e5f31ecbe73f5947858f2938ffb30c304e', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1166, hash: 'b215816f763074ad187aa7979ff63e892d03f17db43bdac1f51d641d26b84c67', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'signup/index.html': {size: 7728, hash: 'd68c0d159cdd529f7530e1cd5746308bc79a67101c04286d7182d8d1a19b426a', text: () => import('./assets-chunks/signup_index_html.mjs').then(m => m.default)},
    'notes/index.html': {size: 13037, hash: 'a5d9cf2b4f15135f7fb278fcc11223376d6cfeca12dc7b19f3e8f86eeb5730ba', text: () => import('./assets-chunks/notes_index_html.mjs').then(m => m.default)},
    'login/index.html': {size: 5041, hash: '5acb0acf586ecfed94ad76f484e2a6dfb0daaaa93e87dded80bb26bea14f351f', text: () => import('./assets-chunks/login_index_html.mjs').then(m => m.default)},
    'styles-5INURTSO.css': {size: 0, hash: 'menYUTfbRu8', text: () => import('./assets-chunks/styles-5INURTSO_css.mjs').then(m => m.default)}
  },
};
