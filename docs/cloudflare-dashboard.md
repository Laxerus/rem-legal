# Rem yönetim panelini Cloudflare Pages üzerinden sunma

Yasal sayfalar statik kalır. Cloudflare Pages Function yalnızca `/manage` ve alt yollarını botun HTTPS adresine aktarır. OAuth oturumu, Discord erişim belirteci ve özellik kontrolleri botun kendi sunucusunda kalır.

## Cloudflare Pages ayarı

Pages projesinde **Settings → Variables and Secrets** bölümüne şu değişkeni ekle:

- `REMBOT_DASHBOARD_UPSTREAM_ORIGIN`: XSystem üzerinde çalışan botun herkese açık HTTPS kök adresi. Örnek biçim: `https://rembot.example-host.com`. Sonuna `/manage` ekleme; yol, sorgu ve kimlik bilgisi girme.

Değişkeni Production ortamına ekle. Preview ortamında da panel test edilecekse ayrıca Preview'a tanımla.

Bu depoda `functions/manage/index.js` tam `/manage` yolunu, `functions/manage/[[path]].js` ise OAuth callback dahil alt yolları karşılar. `_routes.json` yalnızca bu yolları Function'a yönlendirir; `/`, `/terms.html` ve `/privacy.html` statik dosya olarak kalır. Cloudflare Pages projesinin build çıktısı `_routes.json` dosyasını içeren dizin olmalıdır.

## Bot çalışma zamanı ayarları

XSystem'de botun çalışma zamanı değişkenlerine şunları ekle:

- `REMBOT_WEB_DASHBOARD_ENABLED=1`
- `REMBOT_WEB_DASHBOARD_BASE_URL=https://YASAL-SITE-ALAN-ADIN`
- `REMBOT_WEB_DASHBOARD_CLIENT_ID`: Discord OAuth uygulamasının Client ID değeri
- `REMBOT_WEB_DASHBOARD_CLIENT_SECRET`: Discord OAuth Client Secret
- `REMBOT_WEB_DASHBOARD_SESSION_SECRET`: en az 32 karakterlik rastgele gizli değer

OAuth uygulamasındaki redirect URI, tam olarak şu olmalı:

`https://YASAL-SITE-ALAN-ADIN/manage/oauth/callback`

Botun HTTPS adresi XSystem üzerinden erişilebilir olmalı ve aynı HTTP health server üzerinde `/manage` yolunu sunmalı. Değişkenler eklendikten sonra bot yeniden başlatılmalıdır.

## Güvenlik notları

- Discord Client Secret ve session secret bu Git deposuna ya da Pages Function koduna konmaz; yalnız botun güvenli çalışma zamanı değişkenlerinde tutulur.
- Pages proxy'si gelen yolu/sorguyu, form gövdesini, Cookie ve Origin başlıklarını, yanıt durumunu, yönlendirmeleri ve Set-Cookie başlığını aktarır.
- Proxy upstream adresini yalnızca `REMBOT_DASHBOARD_UPSTREAM_ORIGIN` değişkeninden alır; istekten gelen bir hedef URL'ye yönlenmez.
- Panelin kendisi Discord OAuth izin kontrolünü yapar. Sitenin herkese açık olması yönetim yetkisi vermez.
- Bu PR kodu hazırlar; Cloudflare Pages ayarlarını, XSystem ortam değişkenlerini veya DNS'i değiştirmez ve canlı yayın yapmaz.

## İlk kontrol listesi

1. Pages build output dizininin `_routes.json` dosyasını içerdiğini doğrula.
2. Bot HTTPS origin'inin dışarıdan erişilebilir olduğunu doğrula.
3. Discord OAuth redirect URI'sini aynen ekle.
4. Önce Preview ortamında login, callback, cookie, çıkış ve özellik erişim kontrollerini dene.
5. Üretime ancak tüm kontroller geçtikten sonra al.
