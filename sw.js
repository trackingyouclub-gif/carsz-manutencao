// service worker do "Minha Oficina" — o único motivo dele existir é fazer o Chrome/Android (e
// outros navegadores compatíveis) reconhecerem o site como instalável de verdade, criando um
// ícone de app no celular (não só um atalho de navegador). Ele também guarda uma cópia da última
// versão carregada da página, então se abrir o app sem internet por um instante, ainda mostra algo
// em vez de tela em branco — mas não tenta funcionar totalmente offline (o sistema depende do
// Supabase pra tudo que é dado real).
const CACHE = 'minha-oficina-shell-v1';

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(['./', './index.html']).catch(() => {}))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((chaves) => Promise.all(chaves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // network-first: sempre busca a versão mais nova primeiro; só usa o cache se a rede falhar
  // (offline). Assim ninguém fica preso numa versão antiga do sistema por causa do cache.
  e.respondWith(
    fetch(e.request)
      .then((resp) => {
        if (resp && resp.ok && e.request.url.startsWith(self.location.origin)) {
          const copia = resp.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copia));
        }
        return resp;
      })
      .catch(() => caches.match(e.request))
  );
});
