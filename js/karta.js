// Карта «Как дойти»: Яндекс Карты JS API 2.1, подгружается, когда блок подходит к экрану.
// Ключ API: вписать в YMAPS_KEY (кабинет разработчика Яндекса, «JavaScript API и HTTP Геокодер»). Без ключа карта работает, но Яндекс пишет в консоль «Invalid API key».
(function () {
  const YMAPS_KEY = '';
  const box = document.getElementById('ymap');
  if (!box) return;
  const lat = +box.dataset.lat, lon = +box.dataset.lon;
  let started = false;
  const start = () => {
    if (started) return; started = true;
    const s = document.createElement('script');
    s.src = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU' + (YMAPS_KEY ? '&apikey=' + YMAPS_KEY : '');
    s.onload = () => ymaps.ready(init);
    document.head.appendChild(s);
  };
  function init() {
    const wide = innerWidth > 900;
    const map = new ymaps.Map(box, {
      center: [lat, lon], zoom: 16, controls: ['zoomControl']
    }, { suppressMapOpenBlock: false, yandexMapDisablePoiInteractivity: true });
    map.behaviors.disable('scrollZoom');
    if (!wide) map.behaviors.disable('drag'); // на телефоне карта не перехватывает прокрутку страницы
    map.geoObjects.add(new ymaps.Placemark([lat, lon], { hintContent: 'Бэсти Нейлс — Печатников пер., 6' }, {
      iconLayout: 'default#image', iconImageHref: 'assets/ui/metka-karta.svg', iconImageSize: [64, 84], iconImageOffset: [-32, -84]
    }));
    box.classList.add('is-live');
  }
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); start(); } }, { rootMargin: '600px 0px' });
    io.observe(box);
  } else start();
})();
