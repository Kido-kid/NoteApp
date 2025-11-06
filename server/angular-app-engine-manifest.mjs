
export default {
  basePath: 'https://kido-kid.github.io/NoteApp',
  supportedLocales: {
  "en-US": ""
},
  entryPoints: {
    '': () => import('./main.server.mjs')
  },
};
