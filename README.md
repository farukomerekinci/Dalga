# 🌊 Dalga

**Dalga**, arkadaşlarla tek telefonda oynanan telepatik parti oyunudur.
(Wavelength tarzı bir skala/kadran oyununun Türkçe web uygulaması.)

Kurulum gerekmez: tarayıcıda açılır, iPhone'da "Ana Ekrana Ekle" ile uygulama gibi çalışır.

## Nasıl oynanır?

1. Takımlar kurulur. Her turda bir takımın **kâhini** telefonu alır.
2. Ekranda bir **skala** (örn. *Sessiz yer ↔ Gürültülü yer*) ve sadece kâhinin gördüğü **gizli hedef** vardır.
3. Kâhin, hedefi anlatan **tek bir ipucu** söyler (isterse ekrana da yazabilir).
4. Telefon takıma verilir; takım tartışıp kadranı çevirir ve **kilitler**.
5. Hedef açılır: tam ortada **4**, yanlarda **3**, en dışta **2** puan.
6. 4 puan çıkmadıysa karşı takım hedefin okun solunda mı sağında mı olduğunu tahmin eder — doğruysa **+1**.
7. Hedef puana ilk ulaşan takım kazanır.

**Tek Takım (kooperatif)** modunda tek grup, belirlenen tur sayısı boyunca toplam puan toplamaya çalışır.

## Özellikler

- Tek cihazda sırayla oynanır, internet bağlantısı gerektirmez
- 210+ Türkçe skala kartı, tekrarsız karıştırma
- Parmakla sürüklenen kadran + ince ayar butonları
- iPhone için tam ekran (PWA) desteği, güvenli alan (çentik) uyumu
- Sayfa yenilense bile oyun kaldığı yerden devam eder (localStorage)
- Bağımlılık yok: saf HTML/CSS/JS

## Yerelde çalıştırma

```bash
git clone https://github.com/farukomerekinci/Dalga.git
cd Dalga
python3 -m http.server 8000
# tarayıcıda: http://localhost:8000
```

`index.html` dosyasını doğrudan çift tıklayarak da açabilirsiniz.

## GitHub Pages ile yayına alma

Depoda hazır bir Actions iş akışı var (`.github/workflows/pages.yml`).

1. GitHub'da depo → **Settings → Pages**
2. **Source** olarak **GitHub Actions** seçin
3. `main` dalına push edin; iş akışı siteyi otomatik yayınlar

Yayın adresi: `https://farukomerekinci.github.io/Dalga/`

> Alternatif: Settings → Pages → *Deploy from a branch* → `main` / `root`.
> Bu durumda depodaki `.nojekyll` dosyası dosyaların olduğu gibi sunulmasını sağlar.

## iPhone'a uygulama gibi ekleme

Safari'de siteyi açın → **Paylaş** → **Ana Ekrana Ekle**.
Böylece tam ekran, adres çubuğu olmadan açılır.

## Kart ekleme

`cards.js` içindeki `CARDS` dizisine `["sol uç", "sağ uç"]` biçiminde yeni satır ekleyin.

## Dosyalar

| Dosya | Açıklama |
|---|---|
| `index.html` | Tüm ekranların işaretlemesi |
| `styles.css` | Tema ve mobil düzen |
| `app.js` | Oyun akışı, kadran ve puanlama |
| `cards.js` | Skala kartları |
| `manifest.json`, `assets/` | PWA tanımı ve simgeler |

Kişisel/eğlence amaçlı bir hobi projesidir; ticari bir ürünle bağlantısı yoktur.
