Brief Produk: "Pack & Place"
Simulator isometrik untuk mengatur furnitur di ruang sempit: muat atau tidak, dan urutan masuknya.

BAB 1. Overview
1.1 Ringkasan
Aplikasi web berbasis 3D isometrik yang berfungsi seperti "parking game" untuk furnitur. Pengguna memasukkan denah ruangan dan ukuran furnitur, lalu aplikasi menjawab tiga hal:

Apakah semua furnitur muat dan masih menyisakan ruang gerak?
Bisakah setiap furnitur benar-benar dibawa masuk dari pintu ke posisi akhirnya?
Furnitur mana yang harus masuk PERTAMA dan mana yang TERAKHIR?
1.2 Masalah yang diselesaikan
Layout terlihat muat di gambar, tapi pada hari pindahan furnitur tersangkut di lorong atau tikungan.
Furnitur yang dipasang lebih dulu memblokir jalan furnitur lain.
Pintu lemari, laci, dan kursi tidak punya ruang untuk dibuka atau ditarik.
Furnitur flat-pack (mis. IKEA) butuh lantai kosong untuk dirakit, tapi ruangan sudah penuh.
Bagian rapuh (kaca, cermin) pecah jika membentur dinding, tersandar, atau dibawa miring, dan sering tidak jelas apakah bagian itu bisa dilepas dulu.
1.3 Tujuan
Iterasi layout secepat mungkin (drag, lihat hasil, ulangi).
Menghilangkan tebak-tebakan soal urutan masuk barang.
Menemukan layout yang mustahil SEBELUM barang dibeli atau diangkut.
1.4 Fungsi utama
#	Fungsi	Keterangan
1	Input ruangan	Gambar manual atau dari foto/360 (lihat Bab 3.3)
2	Input furnitur	Tabel ukuran (Bab 3.6)
3	Drag and drop	Dengan snap dan umpan balik merah/hijau
4	Cek muat	Furnitur di dalam ruangan, tidak tabrakan, clearance terpenuhi
5	Cek jalur masuk	Pathfinding dari pintu ke posisi akhir
6	Rekomendasi urutan	Urutan masuk + alasannya
7	Playback	Animasi langkah demi langkah
8	Komponen fragile & detachable	Tandai bagian kaca/rapuh dan bagian yang bisa dilepas; sistem memilih cara angkut teraman (Bab 3.7)
1.5 Hasil yang diharapkan (Wanted Outcome)
Pengguna menggambar ruangan sempit, memasukkan 5 furnitur, dan dalam kurang dari 5 menit mendapat:

Verdict: FEASIBLE / TIDAK FEASIBLE
Layout akhir yang valid
Urutan masuk: Step 1, 2, 3, dst.
Jika gagal, alasan spesifik, contoh: "Lemari terhambat tikungan lorong, kurang 4 cm."
1.6 Bukan tujuan (out of scope)
Dekorasi, tekstur realistis, katalog produk, belanja, render fotorealistik.

BAB 2. Pengguna
Pengguna	Situasi	Kebutuhan
Penghuni apartemen/kos kecil	Pindah ke unit 20-30 m², punya kasur, lemari, meja	Tahu semua barang muat dan bisa masuk lewat lift/tangga/lorong
Pembeli furnitur online	Mau beli sofa atau lemari besar	Cek ukuran sebelum bayar, hindari retur karena tidak bisa masuk
Jasa pindahan / kurir furnitur	Mengangkut banyak barang ke banyak rumah	Rencana urutan bongkar muat yang efisien
Desainer interior / tiny home	Ruang sempit dengan banyak batasan	Iterasi layout cepat + bukti kelayakan untuk klien
Contoh skenario: Rina pindah ke apartemen 24 m². Ia mengukur lorong (85 cm) dan pintu (80 cm). Ia memasukkan kasur queen, lemari 2 pintu, meja kerja, dan rak. Aplikasi menunjukkan lemari harus masuk PERTAMA, karena setelah kasur terpasang lorong ke sudut ruangan tertutup. Kasur flat-pack dirakit setelah lemari, sebelum meja dan rak masuk.

BAB 3. Spesifikasi Teknis
3.1 Arsitektur dasar
Simulasi berjalan di denah 2D (x, y, rotasi) ditambah tinggi tiap benda.
Tampilan isometrik hanyalah kamera ortografik (elevasi ~35°, rotasi 45°) yang melihat data itu. Logika tetap sederhana dan cepat.
Engine: Babylon.js (atau Three.js). Semua kalkulasi berjalan di browser, backend tidak wajib.
3.2 Aturan Bounding Box & Sistem Fit
Representasi: setiap furnitur = kotak (OBB / Oriented Bounding Box) dengan id, nama, lebar, panjang, tinggi, posisi(x,y), rotasi, clearance[].

Aturan tabrakan:

Deteksi memakai OBB / Separating Axis Theorem, BUKAN axis-aligned box (intersectsMesh bawaan tidak akurat untuk kotak yang diputar).
Furnitur harus sepenuhnya berada di dalam poligon ruangan.
Furnitur tidak boleh saling tumpang tindih (batas dasar: 0 cm).
Clearance zone = kotak tak terlihat untuk fungsi (mis. lemari +60 cm di depan, kursi +50 cm di belakang). Clearance boleh tumpang tindih dengan area jalan, tapi tidak dengan furnitur lain.
Jalur jalan minimum antar furnitur (default 60 cm, bisa diubah).
Umpan balik visual (gaya parking game):

Hijau = valid, merah = tabrakan, kuning = muat tapi clearance kurang.
Sisi yang bertabrakan disorot tebal (Bab 3.8).
Snap ke dinding dan ke furnitur lain dalam radius 5 cm, grid 5 cm.
3.3 Sistem Kamera / Foto / 360°
Tiga cara memasukkan ruangan, dikerjakan bertahap:

Fase	Metode	Catatan
A (wajib)	Gambar manual: klik titik sudut, ketik panjang dinding, tempel pintu/jendela	Paling akurat, dibangun lebih dulu
B	Foto/360° dipakai sebagai latar tracing: pengguna menjiplak sudut dan garis dinding di atas foto	Aman dan realistis
C	Scan otomatis (LiDAR HP / ARKit / ARCore, atau pihak ketiga seperti Magicplan) → impor denah	Akurat hanya di perangkat yang punya sensor
Penting untuk programmer: ukuran dari foto biasa TIDAK akurat tanpa referensi skala. Jika pakai foto, wajib ada objek referensi (mis. pintu standar, kartu, meteran) dan pengguna HARUS mengonfirmasi ukuran hasil ekstraksi. Toleransi beberapa cm sudah bisa membuat verdict salah, jadi tampilkan tingkat kepercayaan ("±3 cm").

Opsi 360°: viewer panorama untuk melihat ruangan, dengan tombol "tandai sudut" yang menghasilkan titik denah.

3.4 Sistem Rekomendasi Urutan ("AI Recommendation")
Sebagian besar ini algoritma deterministik, bukan LLM. LLM hanya untuk fitur bantu.

Algoritma inti:

Untuk tiap furnitur, jalankan pathfinding A* dengan state (x, y, rotasi) dari pintu ke posisi akhir. Resolusi awal: 5 cm, 15°.
Ukuran benda dipakai sebagai agen (jadi tikungan dihitung dengan benar). Ijinkan gerakan nyata: putar, miringkan/berdirikan (jika opsi diaktifkan). Tiap paket transport (Bab 3.7) adalah agen sendiri; jika furnitur utuh tidak lolos, coba mode lepas-komponen berurutan dari yang paling murah.
Bangun graf dependensi: jika furnitur B memblokir jalur A ke posisi akhirnya, maka A harus masuk sebelum B.
Topological sort menghasilkan urutan. Jika ada siklus (A memblokir B dan B memblokir A), layout dinyatakan tidak feasible, dan itu output paling berharga untuk pengguna.
Tie-breaker (skor): terdalam dulu, terbesar/terberat dulu, butuh ruang rakit dulu.
Ruang rakit: tiap furnitur flat-pack punya footprint rakit. Sistem menyisihkan area kosong dan menjadwalkan perakitan sebelum ruangan terlalu penuh.
Jika gagal, sistem menyarankan perbaikan: geser furnitur X, putar Y, lepas komponen tertentu (mis. pintu kaca), bongkar penuh, atau pilih ukuran lebih kecil.
Peran LLM (opsional): mengubah teks bebas menjadi data ("sofa 3 dudukan 210x90x85"), menjelaskan hasil dengan bahasa awam, dan mengusulkan alternatif layout.

3.5 Input Lingkungan (wajib ada)
Lebar pintu, lebar lorong dan bentuknya, tikungan, tangga/lift, tinggi plafon, tinggi ambang pintu. Tanpa ini pathfinding tidak berarti.

3.6 Menu / Tabel Ukuran Furnitur
Tabel yang bisa diedit pengguna, dengan preset umum:

Nama	P (cm)	L (cm)	T (cm)	Clearance depan	Bisa dimiringkan?	Bisa dibongkar?	Ruang rakit (cm)
Kasur Queen	200	160	40	60 (sisi)	Ya	Ya	220 × 180
Lemari 2 pintu	100	55	200	60	Ya	Ya	210 × 110
Meja kerja	120	60	75	70	Tidak	Sebagian	130 × 70
Sofa 3 dudukan	210	90	85	50	Ya	Tidak	-
Rak buku	80	30	180	40	Ya	Ya	190 × 40
Fitur: tambah/ubah/hapus baris, duplikat, kunci rotasi, warna otomatis per benda, impor CSV. Klik baris untuk membuka sub-tabel komponen (Bab 3.7).

3.7 Komponen, Fragile, dan Detachable
Prinsip: satu furnitur = satu badan induk + nol atau lebih komponen. Tiap komponen punya bounding box sendiri.

Data per komponen:

Field	Arti
dimensi (P, L, T) dan berat	Ukuran dan berat komponen
fragile	Rapuh atau tidak (kaca, cermin, marmer tipis)
fragile_faces	Sisi mana yang tidak boleh tersentuh (mis. sisi depan dan belakang kaca)
detachable	ya / perlu alat / tidak
waktu_lepas_pasang	Estimasi menit
allowed_orientations	Tegak / rebah / berdiri di ujung (kaca biasanya hanya tegak)
max_tilt	Kemiringan maksimum (default kaca 15°, bisa diubah)
padding	Tebal pelindung saat diangkut (default 3 cm per sisi)
reassembly_risk	Risiko rusak/kehilangan garansi jika dibongkar-pasang
Dua bounding box, dua keadaan:

Keadaan	Dipakai untuk	Bounding box
Assembled (terpasang)	Layout akhir, cek muat, clearance	Satu kotak utuh gabungan semua komponen. Tidak berubah, walau semua komponen bisa dilepas
Transport (saat dipindah)	Pathfinding jalur masuk	Satu kotak per paket. Tidak ada yang dilepas: sama dengan assembled. Ada yang dilepas: kotak badan (tanpa bagian yang dilepas) + satu kotak per komponen
Jawaban untuk "kalau semua bisa dilepas, dimensi akhirnya bagaimana?":

Layout akhir tetap memakai kotak assembled. Melepas komponen hanya mengubah cara angkut, bukan ukuran di ruangan.
Selama transport, satu furnitur berubah menjadi beberapa kotak yang lebih kecil dan masing-masing dicek jalurnya sendiri.
Kotak paket fragile = dimensi komponen + padding di semua sisi (mis. kaca 48 × 2 × 195 cm → paket 54 × 8 × 201 cm).
Di tujuan, semua paket harus dirakit kembali, jadi dibutuhkan ruang rakit (Bab 3.4 langkah 6).
Contoh (angka ilustrasi): lemari 2 pintu kaca

Mode angkut	Paket yang diangkut	Bounding box paket	Catatan
0. Utuh	1 paket	100 × 55 × 200	Kaca ikut terbawa, risiko tertinggi
1. Lepas pintu kaca	Badan + 2 pintu kaca (berpadding)	Badan 100 × 53 × 200; pintu 54 × 8 × 201 (×2)	Pintu masuk terakhir dan dipasang terakhir
2. Lepas semua	Panel datar + 2 pintu kaca	Panel 200 × 100 × 15; pintu 54 × 8 × 201 (×2)	Paling kecil, tapi butuh ruang rakit dan waktu terlama
Aturan fragile (hard rule):

Sisi fragile tidak boleh menyentuh atau menggesek dinding, lantai, atau benda lain. Margin aman minimal 5 cm. Pelanggaran = gagal (merah), bukan sekadar peringatan.
Hanya orientasi yang diizinkan, dan kemiringan tidak boleh melebihi max_tilt. Kaca tidak boleh direbahkan.
Di tikungan, hitung sapuan (swept volume) dengan margin lebih besar untuk paket fragile.
Urutan: komponen fragile ditunda selama jalurnya masih bisa dilewati, agar tidak terbentur barang lain yang melintas. Jika jalurnya akan terblokir nanti, ia masuk lebih awal dan disimpan di zona parkir aman (sisi fragile menghadap ke area kosong).
Tidak boleh ditumpuk di bawah benda lain.
Komponen di atas 25 kg (default) ditandai "butuh 2 orang".
Aturan detach:

detachable = tidak → komponen dianggap bagian badan dan tidak pernah dilepas (mis. meja kaca tempered dengan kaki menyatu).
Sistem memilih mode dengan biaya terendah: utuh → lepas komponen fragile → lepas sebagian → bongkar penuh. Biaya = jumlah komponen dilepas + waktu + risiko + perlu alat.
Bongkar penuh hanya boleh jika SEMUA komponen detachable = ya atau perlu alat.
Tampilkan peringatan jika reassembly_risk tinggi (mis. kaca tempered tidak bisa dipotong ulang, garansi bisa hilang).
Contoh data:

{
  "nama": "Lemari kaca",
  "assembled": { "p": 100, "l": 55, "t": 200 },
  "komponen": [
    { "nama": "Badan", "dim": [100, 53, 200], "fragile": false, "detachable": "tidak" },
    { "nama": "Pintu kaca", "qty": 2, "dim": [48, 2, 195], "fragile": true,
      "fragile_faces": ["depan", "belakang"], "detachable": "ya",
      "allowed_orientations": ["tegak"], "max_tilt": 15, "padding": 3, "berat": 9 }
  ]
}
Output ke pengguna: instruksi konkret berurutan, misalnya "1) Lepas 2 pintu kaca dan bungkus (padding 3 cm). 2) Bawa badan lemari masuk, letakkan di sudut. 3) Bawa pintu kaca masuk dalam posisi tegak, pasang terakhir."

Pengaruh ke algoritma: tiap paket menjadi node di graf dependensi. Langkah "pasang komponen" bergantung pada badan induk yang sudah berada di posisi akhir. Pathfinding tiap paket berstatus (x, y, rotasi, orientasi).

3.8 Model 3D: Wireframe Sederhana + Bounding Box
Tiap furnitur = kotak low-poly berwarna pastel, dengan outline wireframe di tepinya. Tanpa tekstur atau pencahayaan realistis.
Bounding box ditampilkan sebagai garis tipis; clearance zone sebagai kotak transparan putus-putus.
Sisi yang bertabrakan (colliding sides) disorot merah tebal, dan jarak tumpang tindih ditampilkan sebagai label ("tumpang tindih 3 cm").
Sisi fragile diwarnai cyan; tabrakan pada sisi fragile berkedip oranye dengan ikon retak (lebih serius dari merah biasa). Komponen yang dilepas tampil sebagai kotak terpisah pada mode Transport, dan menyatu kembali pada mode Assembled.
Bayangan footprint di lantai di bawah tiap benda (agar tidak tampak melayang), warna sesuai status.
Dinding: dua dinding belakang penuh, dinding depan dipotong atau transparan; tombol rotasi tampilan per 90°.
Playback: benda meluncur dari pintu mengikuti jalur, berputar di tikungan, dan berhenti di posisi akhir. Titik macet ditandai merah dan ditahan.
3.9 UI Minimum
Kiri: tabel furnitur. Tengah: viewport isometrik. Kanan: panel hasil (verdict, masalah, saran).
Bawah: slider urutan [Step 1: Lemari] → [Step 2: Kasur] → [Step 3: Meja].
Gaya: kontras tinggi, grid, angka langkah tebal, kilatan merah/hijau ala arcade.
3.10 Fase Pengerjaan
MVP: ruangan manual, furnitur kotak, drag + merah/hijau (OBB), clearance.
Fase 2: input lorong/pintu, pathfinding, verdict feasibility.
Fase 3: graf dependensi, urutan masuk, ruang rakit, playback, komponen fragile dan detachable (mode angkut).
Fase 4: foto/360°/scan, LLM bantu.
3.11 Kriteria Sukses
Drag terasa mulus (≥ 60 fps) dengan ≥ 15 furnitur.
Pathfinding satu furnitur < 1 detik di rumah biasa.
Setiap verdict "tidak feasible" disertai alasan yang bisa dipahami awam.
Tidak ada rencana yang membuat sisi fragile menyentuh dinding/benda lain atau melebihi kemiringan yang diizinkan.
Jika komponen dilepas, layout akhir tetap valid dan ruang rakitnya tersedia.


---
 lanjutan


 Brief sudah saya update, dengan link yang sama seperti sebelumnya. Bab baru 3.7 "Komponen, Fragile, dan Detachable" menjawab pertanyaanmu, dan bab setelahnya bergeser satu nomor.

Jawaban untuk "kalau semua detachable, bounding box-nya bagaimana?": ada dua bounding box, dua keadaan.

Assembled (terpasang): satu kotak utuh yang dipakai untuk layout akhir. Ukurannya tidak berubah walau semua bagian bisa dilepas.
Transport (saat dipindah): satu furnitur berubah jadi beberapa kotak kecil, satu per paket, dan masing-masing dicek jalurnya sendiri.
Bagian fragile: kotak paketnya sama dengan dimensi komponen ditambah padding (default 3 cm per sisi). Kaca 48 × 2 × 195 jadi paket 54 × 8 × 201.
Di tujuan: semua paket harus dirakit lagi, jadi ruang rakit tetap dihitung.

Yang ditambahkan:

Tabel komponen. Tiap bagian punya field fragile, sisi rapuh, detachable (ya/perlu alat/tidak), orientasi yang diizinkan, kemiringan maksimum, padding, berat, dan risiko rakit ulang.
Aturan fragile. Sisi kaca tidak boleh menyentuh dinding atau benda lain (margin 5 cm, gagal jika dilanggar). Kaca hanya boleh dibawa tegak, tidak boleh ditumpuk, dan masuk terakhir kalau jalurnya masih aman.
Pilihan mode angkut. Sistem mencoba dari yang termurah: utuh → lepas bagian fragile → lepas sebagian → bongkar penuh. Ada contoh lemari pintu kaca untuk ketiga mode itu.
Peringatan bongkar-pasang. Tidak semua barang aman dibongkar, misalnya kaca tempered tidak bisa dipotong ulang dan garansi bisa hilang. Bagian yang ditandai "tidak detachable" tidak pernah dilepas.
Visual dan output. Sisi fragile berwarna cyan, dan tabrakan pada sisi itu berkedip oranye dengan ikon retak. Outputnya berupa instruksi konkret, misalnya "lepas 2 pintu kaca → bawa badan masuk → pasang pintu terakhir".

Angka di contoh lemari hanya ilustrasi, jadi programmer perlu memakai ukuran asli produknya.

is there any app that already does this thing?

Sebagian idemu sudah ada, tapi dari hasil pencarian saya, tidak ada satu aplikasi pun yang menggabungkan semuanya.

Cek muat lewat pintu, lorong, dan tangga

Smart Moving: Furniture Helper (iOS/Android): kamu memasukkan ukuran ruang dan jalur yang akan dilewati barang, lalu aplikasi memakai algoritma untuk menghitung kemungkinan muat. Ini yang paling dekat dengan bagian "bisa masuk atau tidak" di briefmu. 
App Store
Furniture Fit Calculator (meltflexai.com): memeriksa apakah sofa, kasur, lemari, atau meja benar-benar bisa sampai ke ruang tujuan. Situsnya juga membahas trik miring, mengangkat pintu dari engselnya, dan lemari utuh versus flat-pack. 
MeltFlex

Perencana layout (drag and drop)

Napkin Plan: upload denah, seret furnitur, dan tahu muat atau tidak sebelum pindahan, dengan handle rotasi untuk sudut yang sempit. Ada versi web dan aplikasi iPhone/iPad. 
NapkinPlan
Layoutr: upload denah, atur skala, lalu letakkan furnitur berukuran asli. 
Layoutr

Referensi teknis dan rasa main

MATLAB "Moving Furniture in a Cluttered Room with RRT": contoh perencanaan jalur memindahkan furnitur besar di ruang sempit, yaitu "Piano Mover's Problem". Ini masalah yang sama dengan pathfinding di briefmu, jadi programmermu bisa memakainya sebagai acuan. 
MathWorks
Moving Out (game): pemain memindahkan furnitur dari rumah ke truk, dengan titik sempit di lorong dan pemuatan ke lift sebagai tantangan. Cocok sebagai referensi rasa "parking game". 
Wikipedia

Yang tidak saya temukan di satu aplikasi:

Urutan masuk furnitur (mana pertama, mana terakhir) berdasarkan siapa yang memblokir siapa.
Aturan sisi fragile dan pilihan lepas komponen, dengan bounding box terpisah per paket.
Ruang rakit untuk flat-pack dalam perhitungan urutan.
Tampilan isometrik dengan playback animasi langkah demi langkah.

Pencarian saya terbatas, jadi saya tidak bisa memastikan aplikasi seperti itu tidak ada di tempat lain (mis. aplikasi jasa pindahan yang tidak dijual bebas).

Saranku: instal Smart Moving dan Napkin Plan dulu untuk membandingkan, dan gunakan pembeda di poin 1-4 sebagai nilai jual produkmu. Mau saya buatkan prototipe isometrik yang menunjukkan salah satu pembeda itu, misalnya urutan masuk dengan playback?

those app isnt does i want :

i wanted to make movement so logistic dan 1 done deal insted of multiple hourly or multiple movement instence and ambiguity what is the desire and avaliable layout and fitting

wdyt?

Planning a single finalized layout instead of multiple iterations.

Ya, dan ini mengubah inti produknya. Yang kamu mau bukan pemeriksa ("muat atau tidak?") seperti aplikasi tadi, tapi perencana yang memberi satu keputusan final: sekali jalan, satu rencana, tanpa bolak-balik dan tanpa ambigu. Menurut saya ini pembeda yang lebih kuat daripada fitur mana pun yang sudah kita tulis.

Ambiguitasnya ada tiga lapis:

Yang diinginkan (layout impian): sering tidak jelas mana yang wajib dan mana yang cuma preferensi.
Yang tersedia (ruang, pintu, lorong, kendaraan): sering tidak lengkap atau tidak akurat.
Yang mungkin (hasil pertemuan keduanya): baru ketahuan di hari pindahan, lalu harus improvisasi beberapa kali.

Cara memecahnya:

Pisahkan input jadi dua kolom. Keinginan punya prioritas: wajib, sebaiknya, boleh dikorbankan. Ketersediaan berisi ruang, jalur, kendaraan, orang, dan waktu.
Solver mencari satu solusi terbaik, bukan banyak opsi. Hasilnya salah satu dari tiga:
Cocok penuh: semua keinginan terpenuhi.
Cocok dengan kompromi: "kamu kehilangan X demi Y", dan yang dikorbankan selalu dari prioritas terendah.
Mustahil: alasan spesifik, plus perubahan minimum yang membuatnya mungkin (mis. "ganti sofa ke 190 cm" atau "lepas pintu kaca").
Satu rencana lengkap, bukan potongan-potongan:
layout akhir
urutan masuk ke ruangan
urutan muat ke truk (kebalikan urutan masuk, jadi yang masuk pertama dimuat paling akhir)
mode angkut tiap barang (utuh atau dilepas)
jumlah orang dan perkiraan waktu
satu kali jalan, bukan beberapa trip
Kunci rencana ("lock plan") jadi checklist hari-H. Kalau ada perubahan, rencana dihitung ulang di awal, bukan diakali di lapangan.
Data kurang atau ragu? Tandai, jangan ditebak. Ukuran yang tidak jelas dihitung dengan toleransi ("lolos dengan margin 2 cm, ukur ulang lorong ini"). Ini penting karena satu ukuran meleset beberapa cm bisa membuat "satu kali jalan" gagal.

Catatan jujur: "satu kali jalan" hanya bisa dijamin kalau datanya akurat dan kendaraan cukup. Karena itu aplikasinya harus punya kolom kapasitas kendaraan dan tingkat kepercayaan, supaya janji "sekali jalan" tidak menyesatkan.

Dampak ke brief:

Bab 1: tujuan berubah dari "cek layout" menjadi "satu rencana pindahan final".
Bab 3: tambah sub-bab Solver dan Prioritas (keinginan vs ketersediaan), Rencana Satu Kali Jalan (urutan muat truk, kapasitas kendaraan, orang, waktu), dan Kunci Rencana + Tingkat Kepercayaan.
Output utama berubah dari verdict feasible/tidak menjadi satu dokumen rencana yang bisa dicetak.
  