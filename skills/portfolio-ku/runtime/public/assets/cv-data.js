// Data resmi dan terverifikasi portofolio & CV M. Vicky Mosafan
// Single Source of Truth untuk Portfolio 3D & Room Tour CV.

export const CV_DATA = {
  profile: {
    fullName: "M. Vicky Mosafan",
    shortName: "Vicky",
    title: "Full Stack Developer & AI Augmented Engineer",
    location: "Surabaya / Jember, Jawa Timur, Indonesia",
    email: "mvickymosafan@gmail.com",
    phone: "+62 823-1944-4740",
    linkedin: "https://www.linkedin.com/in/vickymosafan/",
    github: "https://github.com/vickymosafan",
    summary: "Full Stack Developer dan Prompt Engineer yang berfokus pada AI Augmented Engineering. Mengintegrasikan AI pada seluruh siklus hidup pengembangan perangkat lunak (SDLC) guna meningkatkan kecepatan, presisi arsitektural, dan kualitas kode. Berpegang teguh pada prinsip SOLID, DRY, dan KISS dalam membangun aplikasi yang modular, aman, dan berkinerja tinggi.",
    statusAvailable: true,
    statusText: "Terbuka untuk Peluang Kerja & Kolaborasi Rekayasa",
    gpa: "3.94",
    education: {
      degree: "S1 Sistem Informasi",
      university: "Universitas Muhammadiyah Jember",
      period: "2022 - 2026",
      gpa: "3.94 / 4.00",
      highSchool: "SMAN 1 Situbondo (Jurusan IPA, 2018 - 2020)",
      highSchoolActivity: "Desainer SCaNIT (Smasa Computer and Networking IT) selama 3 tahun."
    }
  },

  philosophy: {
    title: "AI Augmented Software Engineering",
    subtitle: "Menggabungkan Disiplin Rekayasa Perangkat Lunak dengan Akselerasi AI",
    principles: [
      {
        name: "PRD & Architecture First",
        desc: "Merancang PRD terstruktur, diagram arsitektur, dan model data relasional sebelum menulis baris kode pertama guna mencegah technical debt."
      },
      {
        name: "SOLID, DRY, & KISS Standards",
        desc: "Membangun struktur kode yang modular, mudah diuji, dan scalable sehingga dapat dipelihara oleh tim dalam jangka panjang."
      },
      {
        name: "AI-Accelerated SDLC",
        desc: "Memanfaatkan model bahasa besar (LLM) untuk mempercepat eksplorasi API, penulisan unit testing otomatis, audit keamanan, dan optimasi query."
      },
      {
        name: "Zero Slop & Evidence Driven",
        desc: "Menghindari klaim tanpa bukti. Setiap solusi teknis didasarkan pada metrik performa, keamanan API teruji, dan kebutuhan riil pengguna."
      }
    ]
  },

  zones: [
    {
      id: "zone-workstation",
      num: 1,
      name: "Workstation Utama",
      tagline: "Pusat Rekayasa & Profil Pengembang",
      camera: { x: 0, y: 3.2, z: 4.8 },
      target: { x: 0, y: 1.5, z: 0.5 },
      desc: "Meja kerja eksekutif dengan konfigurasi tiga monitor, workstation Linux/Windows, dan terminal interaktif tempat perancangan sistem dilakukan."
    },
    {
      id: "zone-gallery",
      num: 2,
      name: "Galeri Proyek Unggulan",
      tagline: "Showcase Aplikasi & Arsitektur Sistem",
      camera: { x: 6.8, y: 3.6, z: 2.2 },
      target: { x: 6.8, y: 2.4, z: -2.8 },
      desc: "Dinding pameran interaktif yang menampilkan proyek-proyek riil, mulai dari sistem pemantauan kesehatan lansia hingga platform informasi arsitektur."
    },
    {
      id: "zone-server",
      num: 3,
      name: "Server Rack & Tech Stack",
      tagline: "Modul & Infrastruktur Teknologi",
      camera: { x: -6.5, y: 3.2, z: -0.5 },
      target: { x: -7.2, y: 2.2, z: -3.5 },
      desc: "Visualisasi rak server fisik modular berisi tumpukan teknologi backend, frontend, database engine, dan lingkungan kerja AI."
    },
    {
      id: "zone-trophy",
      num: 4,
      name: "Piagam & Kepemimpinan",
      tagline: "Organisasi, Edukasi, & Sertifikasi",
      camera: { x: -5.2, y: 3.4, z: 4.5 },
      target: { x: -5.5, y: 2.5, z: 0.5 },
      desc: "Rak piagam penghargaan dan rekam jejak kepengurusan organisasi mahasiswa, mentoring pemrograman anak-anak, dan sertifikasi resmi."
    },
    {
      id: "zone-lounge",
      num: 5,
      name: "Philosophy Lounge",
      tagline: "Filosofi & Metodologi Kerja",
      camera: { x: 4.5, y: 3.0, z: 6.5 },
      target: { x: 3.2, y: 1.4, z: 4.0 },
      desc: "Sudut diskusi santai untuk mengeksplorasi prinsip AI Augmented Engineering, manajemen siklus hidup perangkat lunak, dan standar kode bersih."
    },
    {
      id: "zone-reception",
      num: 6,
      name: "Meja Depan & Kontak",
      tagline: "Hubung Langsung & Unduh CV",
      camera: { x: 0, y: 2.8, z: 8.8 },
      target: { x: 0, y: 1.2, z: 6.0 },
      desc: "Titik temu komunikasi langsung untuk mengunduh dokumen resume resmi, mengirim pesan, atau membuka profil LinkedIn."
    }
  ],

  projects: [
    {
      id: "posyandu",
      title: "Digital Posyandu (Monitoring Lansia)",
      category: "Full Stack Web Application",
      period: "Agustus 2025 - Sekarang",
      client: "Universitas Muhammadiyah Jember",
      role: "Freelance Website Developer (Solo)",
      techStack: ["Next.js", "Express.js", "Prisma ORM", "PostgreSQL", "TypeScript"],
      highlight: "Sistem pemantauan kesehatan berkala lansia dengan analisis tren otomatis untuk kader Posyandu.",
      details: [
        "Membangun antarmuka terpadu untuk pencatatan indeks massa tubuh (IMT/BMI), tekanan darah sistolik dan diastolik, kadar kolesterol, serta asam urat.",
        "Mengembangkan kalkulasi otomatis untuk deteksi dini risiko hipertensi dan peringatan kondisi kesehatan kritis.",
        "Merancang skema relasional PostgreSQL dengan Prisma ORM untuk menjamin integritas data rekam medis lansia.",
        "Menyediakan dashboard tren analitik visual guna memudahkan evaluasi kondisi kesehatan warga binaan."
      ],
      color: "#2f9a6d"
    },
    {
      id: "antosa",
      title: "PT Antosa Architect Web Information System",
      category: "Enterprise Web Architecture",
      period: "April 2025 - Juli 2025",
      client: "PT Antosa Architect",
      role: "Project Web Architect",
      techStack: ["Modern Web Architecture", "Relational Database", "RESTful API", "JavaScript"],
      highlight: "Sistem informasi manajemen proyek arsitektur dan koordinasi dokumen desain konstruksi.",
      details: [
        "Menganalisis alur bisnis perusahaan arsitektur dan memetakannya ke dalam sistem web yang terstruktur.",
        "Merancang tata letak antarmuka, struktur basis data, dan modul pelacakan status proyek konstruksi secara berkala.",
        "Meningkatkan efisiensi komunikasi tim dan aksesibilitas dokumen kerja bagi arsitek maupun klien.",
        "Menerapkan praktik rekayasa web modern dengan fokus pada kemudahan pemeliharaan sistem jangka panjang."
      ],
      color: "#3f6fd1"
    },
    {
      id: "mandiri",
      title: "NewsAPL (Bank Mandiri Mobile Apps)",
      category: "Android Mobile Development",
      period: "Februari 2025 - Maret 2025",
      client: "PT Bank Mandiri (Persero) Tbk x Rakamin Academy",
      role: "Mobile Apps Developer Intern",
      techStack: ["Kotlin", "Android SDK", "Unit Testing", "RESTful API", "GitLab"],
      highlight: "Aplikasi berita mobile berbasis Android dengan arsitektur bersih dan unit testing komprehensif.",
      details: [
        "Mengembangkan aplikasi mobile native menggunakan bahasa Kotlin dan arsitektur MVVM.",
        "Menulis unit testing terautomasi untuk memastikan stabilitas logika bisnis dan parsing payload JSON.",
        "Mengintegrasikan RESTful endpoint berita dengan mekanisme penanganan kegagalan jaringan yang tangguh.",
        "Melakukan kolaborasi tim rekayasa perangkat lunak dan manajemen versi melalui alur kerja GitLab."
      ],
      color: "#6a55c9"
    },
    {
      id: "beyond-rag",
      title: "Beyond RAG Artificial Super Intelligence",
      category: "AI & Knowledge Retrieval System",
      period: "2025",
      client: "Riset Mandiri",
      role: "AI Augmented Engineer",
      techStack: ["Python", "Vector Embeddings", "RAG Pipeline", "Prompt Engineering"],
      highlight: "Arsitektur penelusuran pengetahuan multi-tahap dengan re-ranking berbasis konteks spesifik.",
      details: [
        "Merancang pipeline pengambilan dokumen yang memadukan pencarian semantik dan verifikasi fakta otomatis.",
        "Mengembangkan teknik prompt terstruktur untuk mengurangi halusinasi pada model bahasa besar (LLM).",
        "Mengimplementasikan pemrosesan dokumen kontekstual untuk sistem tanya jawab teknis tingkat lanjut."
      ],
      color: "#d9772f"
    },
    {
      id: "other-apps",
      title: "Sistem Pendukung & Tooling Spesifik",
      category: "Utility & Data Tools",
      period: "2023 - 2025",
      client: "Pengembangan Solusi Khusus",
      role: "Software Developer",
      techStack: ["Node.js", "TypeScript", "Python", "Tailwind CSS"],
      highlight: "Rangkaian perkakas bantu: CommOS, Ngopi Jember, Analisis Pasar XAUUSD, Alarm Windows, dan Konverter Media.",
      details: [
        "CommOS: Eksplorasi konsep antarmuka sistem operasi berbasis web dan manajemen modul.",
        "Ngopi Jember: Portal direktori tempat kerja dan kafe ramah pengembang di area Jember.",
        "Analisis Pasar XAUUSD: Alat analitik pergerakan teknikal komoditas emas menggunakan kalkulasi indikator matematis.",
        "Playlist Downloader & Image Converter: Utilitas otomatisasi pengunduhan dan optimasi aset visual lokal."
      ],
      color: "#0f8fa3"
    }
  ],

  techStack: {
    languages: [
      { name: "JavaScript", level: "Mahir", badge: "Core" },
      { name: "TypeScript", level: "Mahir", badge: "Core" },
      { name: "HTML5 & CSS3", level: "Mahir", badge: "Core" },
      { name: "Kotlin", level: "Menengah", badge: "Mobile" },
      { name: "Python", level: "Menengah", badge: "Data & AI" }
    ],
    frontend: [
      { name: "React", level: "Mahir", badge: "UI Framework" },
      { name: "Next.js", level: "Mahir", badge: "Full Stack" },
      { name: "Vue.js", level: "Menengah", badge: "Reactive UI" },
      { name: "Tailwind CSS", level: "Mahir", badge: "Styling" },
      { name: "Three.js", level: "Menengah", badge: "3D Graphics" }
    ],
    backend: [
      { name: "Node.js", level: "Mahir", badge: "Runtime" },
      { name: "Express.js", level: "Mahir", badge: "RESTful API" },
      { name: "Nest.js", level: "Menengah", badge: "Enterprise" },
      { name: "Hono.js", level: "Menengah", badge: "Edge API" },
      { name: "Laravel", level: "Menengah", badge: "MVC Framework" }
    ],
    database: [
      { name: "PostgreSQL", level: "Mahir", badge: "Relational" },
      { name: "MySQL", level: "Mahir", badge: "Relational" },
      { name: "Prisma ORM", level: "Mahir", badge: "Data Layer" },
      { name: "SQLite", level: "Mahir", badge: "Embedded" }
    ],
    aiAndTools: [
      { name: "Antigravity IDE", level: "Mahir", badge: "Agentic" },
      { name: "Cursor & Windsurf", level: "Mahir", badge: "AI Coding" },
      { name: "GitHub Copilot", level: "Mahir", badge: "Pair Programming" },
      { name: "Git & GitLab", level: "Mahir", badge: "VCS Workflow" },
      { name: "VS Code", level: "Mahir", badge: "Development" }
    ]
  },

  leadershipAndCommunity: [
    {
      role: "Kepala Departemen MediaTech",
      org: "HIMAFORSI Universitas Muhammadiyah Jember",
      period: "2022 - 2024",
      desc: "Memimpin strategi komunikasi digital, manajemen aset publikasi, branding organisasi, serta perancangan konten edukasi teknologi informasi."
    },
    {
      role: "Tutor Pemrograman Anak Sekolah Dasar",
      org: "Program Edukasi Logika Komputasi",
      period: "2024",
      desc: "Membimbing siswa kelas 5 SD dalam membangun permainan logika sederhana (Catch Me & Dino Chrome) menggunakan platform Scratch untuk menumbuhkan minat rekayasa digital sejak dini."
    },
    {
      role: "Relawan Asisten TIK",
      org: "RTIK Goes to School (Relawan TIK Jember)",
      period: "2023",
      desc: "Menyosialisasikan literasi teknologi dan pemanfaatan perangkat digital bagi guru dan murid di SDN 2 Plalangan, Kecamatan Kalisat, Jember."
    },
    {
      role: "Pemateri Desain & Pemrograman",
      org: "Diklat Program Studi Sistem Informasi",
      period: "2024",
      desc: "Berbagi wawasan seputar prinsip perancangan antarmuka pengguna dan dasar logika pemrograman kepada mahasiswa baru."
    },
    {
      role: "Koordinator Acara Sisfo Insinco",
      org: "Kompetisi Desain Keamanan Siber",
      period: "2023",
      desc: "Mengelola jalannya kompetisi desain keamanan siber, mulai dari koordinasi peserta, logistik, penilaian, hingga publikasi acara."
    }
  ],

  certifications: [
    {
      title: "15 AI Learning Modules for Youth",
      issuer: "AI Educational Initiative",
      category: "Artificial Intelligence"
    },
    {
      title: "The Modern Data Platform & LookML",
      issuer: "Data Engineering Academy",
      category: "Data Platform"
    },
    {
      title: "React.js with HookEffect & Data Fetching",
      issuer: "Web Development Certification",
      category: "Frontend"
    },
    {
      title: "Next.js Fullstack with Headless CMS",
      issuer: "Modern Web Institute",
      category: "Full Stack"
    },
    {
      title: "Nest.js Backend Development",
      issuer: "Enterprise Architecture Program",
      category: "Backend"
    },
    {
      title: "RESTful API Architecture with Express.js",
      issuer: "Backend Engineering Certification",
      category: "Backend"
    },
    {
      title: "Android Application Development (Kotlin)",
      issuer: "PT Bank Mandiri x Rakamin Academy",
      category: "Mobile"
    }
  ]
};
