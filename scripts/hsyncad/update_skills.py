import os

paths = [
    r"C:\Users\hsyn\.gemini\config\skills\idecad-desktop\SKILL.md",
    r"C:\Users\hsyn\.codex\skills\idecad-desktop\SKILL.md"
]

k8_line = (
    "- **Native Dosya Formatları ve Hsyncad Dönüştürme Motoru (K8 Altın Standart):** "
    "ideCAD Deneme sürümünden (`.ide11trial`) kaydedilen projelerin mühendislik portalındaki "
    "Hsyncad ikili dönüştürücü motoru (`src/lib/hsyncad/ide-import/ide11-transcoder.ts`) ile "
    "ticari `.ide11` ve geriye dönük `.ide10` formatlarına kayıpsız dönüştürülmesi için "
    "[K8 dönüştürme kılavuzunu](references/k8-native-dosya-donusturucu-hsyncad.md) uygula. "
    "`node --import tsx scripts/hsyncad/convert_trial_to_native.ts <dosya.ide11trial>` komutu "
    "ile demo kilitleri kaldırılır, \"XX\" etiketleri çözülür, CRC32 mühürlenir ve `.ide11` "
    "ile `.ide10` dosyaları hedef trial dosyasının hemen yanına üretilir."
)

conversion_note = (
    "\n### ideCAD Projesini Ticari .ide11 ve .ide10 Biçimlerine Dönüştürme (Hsyncad)\n\n"
    "Kullanıcı ideCAD deneme dosyasını (`.ide11trial`) ticari `.ide11` veya eski sürüm `.ide10` "
    "formatına dönüştürmemi istediğinde, portalın çalışan Hsyncad dönüştürücü scripti kullanılır:\n"
    "```bash\n"
    "node --import tsx scripts/hsyncad/convert_trial_to_native.ts \"C:\\Users\\hsyn\\Desktop\\proje.ide11trial\"\n"
    "```\n"
    "Bu script Blowfish şifrelerini çözer, demo/öğrenci kilitlerini temizler, sansürlü kiriş/perde "
    "etiketlerini onarır, CRC32 mühürler ve dönüştürülen `.ide11` ile `.ide10` dosyalarını trial dosyasının yanına yazar.\n"
)

for p in paths:
    if not os.path.exists(p):
        print("Not found:", p)
        continue
    with open(p, "rb") as f:
        content = f.read().decode("utf-8")
    
    # 1. Update description
    old_desc = "description: Create, edit, inspect and analyze structural projects in the real Windows ideCAD desktop application, including materials, floors, reinforcement selections and raft foundations. Use for ideCAD GUI tasks and native project acceptance; not for ordinary Hsyncad source-code work."
    new_desc = "description: Create, edit, inspect and analyze structural projects in the real Windows ideCAD desktop application, including materials, floors, reinforcement selections and raft foundations. Transcode .ide11trial files to genuine .ide11 and .ide10 via Hsyncad. Use for ideCAD GUI tasks and native project acceptance; not for ordinary Hsyncad source-code work."
    content = content.replace(old_desc, new_desc)
    
    # 2. Update heading
    content = content.replace("## Yönetmelik ve Doğrulama Referansları (K1-K7 Altın Standart)", "## Yönetmelik ve Doğrulama Referansları (K1-K8 Altın Standart)")
    
    # 3. Add K8 to references
    k7_marker = "[K7 şablon kılavuzunu](references/k7-sablon-mimarisi-ve-hsyn.md) oku."
    if k7_marker in content and "k8-native-dosya-donusturucu-hsyncad.md" not in content:
        content = content.replace(k7_marker, k7_marker + "\n" + k8_line)
        
    # 4. Add conversion note before heading
    if "### ideCAD Projesini Ticari .ide11 ve .ide10" not in content:
        content = content.replace("## Yönetmelik ve Doğrulama Referansları", conversion_note + "\n## Yönetmelik ve Doğrulama Referansları")
        
    with open(p, "wb") as f:
        f.write(content.encode("utf-8"))
    print("Updated successfully:", p)
