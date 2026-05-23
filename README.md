# HAKKIN İZİNDE - Dijital E-Dergi Arşivi

Bu proje, **HAKKIN İZİNDE** dergisine özel, web tabanlı bir dijital sayı arşivleme ve okuma platformudur. Yönetici (Admin) sisteme giriş yaparak yeni sayılar ekleyebilir, ziyaretçiler ise tüm arşivi interaktif bir dergi okuyucu (flipbook stili) üzerinden inceleyebilir.

## 🚀 Başlangıç

Projeyi yerel bilgisayarınızda çalıştırmak için aşağıdaki adımları takip edin:

1. **Bağımlılıkları Yükleme:**
   ```bash
   npm install
   ```

2. **Sunucuyu Çalıştırma:**
   Sunucuyu başlatmak için iki farklı yöntem kullanabilirsiniz:
   
   * **Geliştirme Modu (Otomatik Yeniden Başlatma):**
     ```bash
     npm run dev
     ```
   * **Normal Mod:**
     ```bash
     npm start
     ```

3. **Tarayıcıda Açma:**
   Tarayıcınızı açın ve aşağıdaki adrese gidin:
   * **Ziyaretçi Arayüzü (Anasayfa):** `http://localhost:3000`
   * **Yönetim Paneli (Admin):** `http://localhost:3000/admin.html`

---

## 🔑 Giriş Bilgileri

* **Varsayılan Giriş Şifresi:** `admin123`
* *Şifreyi değiştirmek için:* Sunucuyu başlatırken terminale ortam değişkeni (Environment Variable) tanımlayabilirsiniz:
  * **Windows (PowerShell):** `$env:ADMIN_PASSWORD="yeni-sifreniz"; node server.js`
  * **Windows (CMD):** `set ADMIN_PASSWORD=yeni-sifreniz&& node server.js`
  * **Linux/macOS:** `ADMIN_PASSWORD="yeni-sifreniz" node server.js`

---

## 📁 Proje Yapısı ve Özellikler

* **`server.js`:** Express.js altyapılı, veri depolama ve dosya yükleme API'lerini barındıran sunucu dosyası.
* **`public/`:** Web arayüzünün (HTML, CSS ve JavaScript) yer aldığı klasör.
  * **`index.html`:** Sayıların listelendiği anasayfa ve interaktif okuyucu modalı.
  * **`admin.html`:** Sayı yükleme, istatistikler ve mevcut sayıları silme işlemlerinin yapıldığı yönetim paneli.
  * **`css/style.css`:** Premium karanlık tema, cam morfizasyonu (glassmorphism) ve geçiş efektlerini içeren stil şablonu.
* **`data/magazines.json`:** Sayıların meta verilerini (başlık, açıklama, kapak ve sayfa yolları) saklayan hafif veritabanı dosyası (veri kaybını önlemek için otomatik oluşturulur).
* **`uploads/`:** Yüklenen kapak resimleri (`covers/`) ve iç sayfaların (`pages/`) saklandığı klasör.

---

## 📖 Sayfa Yükleme Kuralları (Önemli)

Sayıyı eklerken iç sayfaların doğru okuma sırasına göre dizilmesi için yükleyeceğiniz resimlerin dosya adlarını alfabetik/numerik sıraya göre adlandırın:
* ❌ **Yanlış Adlandırma:** `tanitim.jpg`, `sayfa1.jpg`, `son.jpg` (Sıralama karışık olabilir)
*  **Doğru Adlandırma:** `sayfa-01.jpg`, `sayfa-02.jpg`, `sayfa-03.jpg` (veya `01.jpg`, `02.jpg` vb.)

*Sistem, seçtiğiniz resimleri isimlerine göre alfabetik olarak otomatik sıralayarak dergi haline getirir. Seçim ekranında sıralamayı kontrol edebilirsiniz.*

---

## 💻 Okuma Arayüzü Özellikleri

* **Çift Sayfa Görünümü:** Masaüstü ve büyük ekranlarda gerçek dergi deneyimi için çift sayfa (kapak hariç) yan yana gösterilir. Mobil cihazlarda otomatik olarak tek sayfaya geçer.
* **Küçük Resim Şeridi (Thumbnails):** Alt kısımdaki şeritten istediğiniz sayfaya hızlıca zıplayabilirsiniz.
* **Yakınlaştırma (Zoom):** Sayfaları ince detaylarıyla okumak için `%100` ile `%250` arasında yakınlaştırıp fare ile sürükleyebilirsiniz.
* **Klavye Yön Tuşları:** Sağ ve Sol yön tuşlarıyla hızlıca sayfaları çevirebilir, `ESC` tuşuyla okuyucudan çıkabilirsiniz.
* **Tam Ekran Desteği:** Sağ üstteki tam ekran butonu ile dikkat dağıtıcı unsurlar olmadan okuma yapabilirsiniz.
