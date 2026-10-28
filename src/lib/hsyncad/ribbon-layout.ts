/** Original web layout manifest derived from REA-verified semantic Ribbon records.
 * Source resource 25955; names/order/large flags are observed static data.
 * Native artwork, executable bytes and handler code are not included.
 * HIDDEN is retained separately because the native declaration explicitly hides it.
 */
export type NativeRibbonCommand = { id: string; commandId: number | null; symbol: string; label: string; large: boolean; children: NativeRibbonCommand[]; type: string };
export type NativeRibbonPanel = { id: string; label: string; commands: NativeRibbonCommand[] };
export type NativeRibbonTab = { id: string; label: string; panels: NativeRibbonPanel[] };

export const NATIVE_RIBBON_SOURCE = {
  "resourceId": 25955,
  "resourceIndex": 4498,
  "evidenceId": "ev_9f35633090bc9cccb12487a0c5d6ca7477bea0b3714390ab98cc619d1d6677e2",
  "artifactSha256": "a4dcabe8680507c1444a4cb40a2f908f9bf51120929a8f763b425b60ff2cbdd3",
  "resourcePayload": {
    "location": {
      "bytes": 702753,
      "offset": 211996456
    },
    "rva": 217387304,
    "sha256": "6f3f23a4a7c440dab175153bbc670358ec6547767e65f9e2ae6953c3d407a4ac"
  },
  "hierarchySha256": "df33a8ca93d4eb17930eebad4513d0bca925ee636082ea4720ea993e8547e6e7",
  "sourceArchive": "incelemeler/idecad-rea/denetim-2026-10-27/ribbon-komut-hiyerarsisi.json",
  "visibleTabCount": 12,
  "hiddenTabCount": 1,
  "unknowns": [
    "Live template selection, dynamic toolbars and enable/disable conditions are unobserved.",
    "Data describes native layout only; command implementation/availability is decided separately."
  ]
};

export const NATIVE_RIBBON_TABS: NativeRibbonTab[] = [
  {
    "id": "Betonarme",
    "label": "Betonarme",
    "panels": [
      {
        "id": "r25955-Betonarme-panel-0",
        "label": "Proje Ayarları",
        "commands": [
          {
            "id": "r25955-11710-212028703",
            "commandId": 11710,
            "symbol": "CM_ANALYSIS_SETTINGS",
            "label": "Analiz Ayarları",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-15700-212029171",
            "commandId": 15700,
            "symbol": "CM_RIBBON_MENU_WINDOW_LIST_STORIES",
            "label": "Kat listesi",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-11240-212029616",
            "commandId": 11240,
            "symbol": "CM_STORY_SETTINGS",
            "label": "Kat Genel Ayarları",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12500-212030082",
            "commandId": 12500,
            "symbol": "CM_FAST_COPY",
            "label": "Kat Kopyala",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40350-212030536",
            "commandId": 40350,
            "symbol": "CM_CHECK_SEMI_RIGID",
            "label": "Yarı Rijit",
            "large": false,
            "children": [],
            "type": "Button_Check"
          }
        ]
      },
      {
        "id": "r25955-Betonarme-panel-1",
        "label": "Aks",
        "commands": [
          {
            "id": "r25955-12590-212031418",
            "commandId": 12590,
            "symbol": "CM_DRAW_AXIS",
            "label": "Aks",
            "large": true,
            "children": [
              {
                "id": "r25955-13980-212031869",
                "commandId": 13980,
                "symbol": "CM_CALCULATE_CONTOUR",
                "label": "Kontur Hesapla",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12660-212032383",
                "commandId": 12660,
                "symbol": "CM_SETTINGS_CONTOUR",
                "label": "Kontur Çizgileri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12673-212032897",
                "commandId": 12673,
                "symbol": "CM_MOVE_AXIS_LABEL",
                "label": "Aks Etiketini Taşı",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212033416",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-12580-212033632",
                "commandId": 12580,
                "symbol": "CM_SETTINGS_AXIS",
                "label": "Aks Ayarları",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-40071-212034192",
            "commandId": 40071,
            "symbol": "CM_DRAW_ARC_AXIS",
            "label": "Yay Aks",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40072-212034658",
            "commandId": 40072,
            "symbol": "CM_DRAW_ARC_AXIS_3P",
            "label": "3 Noktadan Yay Aks",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12671-212035127",
            "commandId": 12671,
            "symbol": "CM_AXIS_DRAW_TYPE",
            "label": "Aks Çizim Tipini Değiştir",
            "large": false,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Betonarme-panel-2",
        "label": "Duvar",
        "commands": [
          {
            "id": "r25955-14100-212035953",
            "commandId": 14100,
            "symbol": "CM_DRAW_MULTIWALL",
            "label": "Duvar",
            "large": true,
            "children": [
              {
                "id": "r25955-14120-212036417",
                "commandId": 14120,
                "symbol": "CM_SETTINGS_WALL",
                "label": "Duvar Ayarları",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-40074-212036983",
            "commandId": 40074,
            "symbol": "CM_DRAW_CURVEWALL",
            "label": "Eğrisel Duvar",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12770-212037450",
            "commandId": 12770,
            "symbol": "CM_DRAW_DIO",
            "label": "Kapı/Pencere",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40127-212037910",
            "commandId": 40127,
            "symbol": "CM_DRAW_ARCWALL_3P",
            "label": "Sürekli Yay Duvar",
            "large": false,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Betonarme-panel-3",
        "label": "Betonarme",
        "commands": [
          {
            "id": "r25955-12820-212038724",
            "commandId": 12820,
            "symbol": "CM_DRAW_RECTANGLECOLUMN",
            "label": "Kolon",
            "large": true,
            "children": [
              {
                "id": "r25955-12890-212039188",
                "commandId": 12890,
                "symbol": "CM_SETTINGS_COLUMN",
                "label": "Kolon Ayarları",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-12840-212039752",
            "commandId": 12840,
            "symbol": "CM_DRAW_CIRCLECOLUMN",
            "label": "Daire Kolon",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12830-212040221",
            "commandId": 12830,
            "symbol": "CM_DRAW_POLYGONCOLUMN",
            "label": "Poligon Kolon",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12711-212040691",
            "commandId": 12711,
            "symbol": "CM_DRAW_COLUMN_SUPPORT",
            "label": "Kolon Başlığı",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212041163",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-12910-212041307",
            "commandId": 12910,
            "symbol": "CM_DRAW_MULTIBEAM",
            "label": "Kiriş",
            "large": true,
            "children": [
              {
                "id": "r25955-1825-212041766",
                "commandId": 1825,
                "symbol": "CM_DRAW_CIRCLE_BEAM",
                "label": "Dairesel Kiriş",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212042279",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-12920-212042439",
                "commandId": 12920,
                "symbol": "CM_SETTINGS_BEAM",
                "label": "Kiriş Ayarları",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-1823-212043002",
            "commandId": 1823,
            "symbol": "CM_DRAW_CURVE_BEAM",
            "label": "Eğrisel Kiriş",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-1829-212043469",
            "commandId": 1829,
            "symbol": "CM_DRAW_ARC_BEAM_3P",
            "label": "Sürekli Yay Kiriş",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-1824-212043937",
            "commandId": 1824,
            "symbol": "CM_DRAW_ARC_BEAM",
            "label": "Yay Kiriş",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212044402",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-13810-212044546",
            "commandId": 13810,
            "symbol": "CM_DRAW_PANEL",
            "label": "Perde",
            "large": true,
            "children": [
              {
                "id": "r25955-13812-212045006",
                "commandId": 13812,
                "symbol": "CM_DRAW_SUB_BASEMENT_PANEL",
                "label": "Subasman Perdesi",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-13811-212045530",
                "commandId": 13811,
                "symbol": "CM_DRAW_REINFORCEMENT_PANEL",
                "label": "Güçlendirme Perdesi",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11641-212046058",
                "commandId": 11641,
                "symbol": "CM_SET_SHEARWALL_LENGTH",
                "label": "Perde Uzunluğunu Değiştir",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-13820-212046612",
                "commandId": 13820,
                "symbol": "CM_SETTINGS_PANEL",
                "label": "Perde Ayarları",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212047175",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-12570-212047319",
            "commandId": 12570,
            "symbol": "CM_DRAW_SLAB",
            "label": "Döşeme",
            "large": true,
            "children": [
              {
                "id": "r25955-12572-212047775",
                "commandId": 12572,
                "symbol": "CM_CREATE_FREE_MODE_SLAB",
                "label": "Kontur Seçerek Döşeme Oluştur",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-13110-212048316",
                "commandId": 13110,
                "symbol": "CM_DRAW_SLAB_HOLE",
                "label": "Döşeme Boşluğu",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212048829",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-14210-212048989",
                "commandId": 14210,
                "symbol": "CM_SCL_DELETE",
                "label": "Betonarme Hesap Aksı Sil",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212049512",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-65039-212049672",
                "commandId": 65039,
                "symbol": "CM_DRAW_SLAB_BAND_LINE",
                "label": "Bant Kiriş",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-65040-212050206",
                "commandId": 65040,
                "symbol": "CM_DRAW_SLAB_BAND_ARC",
                "label": "Yay Bant Kiriş",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212050743",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-13120-212050959",
                "commandId": 13120,
                "symbol": "CM_SETTINGS_SLAB",
                "label": "Döşeme Ayarları",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-14190-212051524",
            "commandId": 14190,
            "symbol": "CM_GET_SLAB_CONCRETE_LINES",
            "label": "Betonarme Hesap Aksı Çiz",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-14202-212052000",
            "commandId": 14202,
            "symbol": "CM_SCL_CHANGE_GEOMETRY",
            "label": "Donatı Hesap Aksı Geometrisi Değiştir",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-14200-212052472",
            "commandId": 14200,
            "symbol": "CM_SCL_EDIT",
            "label": "Betonarme Hesap Aksı Edit",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-13580-212052933",
            "commandId": 13580,
            "symbol": "CM_TRANSFORM_SLAB_TO_NERVUR",
            "label": "Nervüre Dönüştür",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-13590-212053410",
            "commandId": 13590,
            "symbol": "CM_TRANSFORM_SLAB_TO_CASETTE",
            "label": "Kasede Dönüştür",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40010-212053892",
            "commandId": 40010,
            "symbol": "CM_SET_TYPICAL_NERV_BEAM",
            "label": "Tipik Diş Belirle",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-13110-212054366",
            "commandId": 13110,
            "symbol": "CM_DRAW_SLAB_HOLE",
            "label": "Döşeme Boşluğu",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-14240-212054832",
            "commandId": 14240,
            "symbol": "CM_DRAW_LINEAR_LOAD",
            "label": "Çizgisel Döşeme Yükü",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-14230-212055301",
            "commandId": 14230,
            "symbol": "CM_DRAW_POINT_LOAD",
            "label": "Noktasal Döşeme Yükü",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-14350-212055769",
            "commandId": 14350,
            "symbol": "CM_DRAW_SLAB_EDGE",
            "label": "Döşeme Kenarı",
            "large": true,
            "children": [
              {
                "id": "r25955-14370-212056240",
                "commandId": 14370,
                "symbol": "CM_DRAW_CURVE_STATIC_SLAB_EDGE",
                "label": "Eğrisel Döşeme Kenarı",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-14380-212056775",
                "commandId": 14380,
                "symbol": "CM_DRAW_ARC_STATIC_SLAB_EDGE",
                "label": "Yay Döşeme Kenarı",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-14390-212057303",
                "commandId": 14390,
                "symbol": "CM_DRAW_CIRCLE_STATIC_SLAB_EDGE",
                "label": "Dairesel Döşeme Kenarı",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-1832-212057839",
                "commandId": 1832,
                "symbol": "CM_DRAW_ARC_STATIC_SLAB_EDGE_3P",
                "label": "Sürekli Döşeme Kenarı",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212058374",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-14610-212058534",
                "commandId": 14610,
                "symbol": "CM_SETTINGS_STATIC_SLAB_EDGE",
                "label": "Döşeme Kenarı Ayarları",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212059119",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-13830-212059263",
            "commandId": 13830,
            "symbol": "CM_DRAW_STAIR",
            "label": "Merdiven",
            "large": true,
            "children": [
              {
                "id": "r25955-62908-212059722",
                "commandId": 62908,
                "symbol": "CM_CREATE_STAIR",
                "label": "Yeni Merdiven Oluştur",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-62912-212060260",
                "commandId": 62912,
                "symbol": "CM_ADD_STAIR_AREA",
                "label": "Merdiven Alanı Ekle",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-13880-212060798",
                "commandId": 13880,
                "symbol": "CM_STAIR_DEFORMATION",
                "label": "Merdiven Deformasyonu",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-602-212061319",
                "commandId": 602,
                "symbol": "CM_MOVE_STAIR_TEXT",
                "label": "Merdiven Yazısını Taşı",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-13860-212061844",
                "commandId": 13860,
                "symbol": "CM_SHOW_HIDE_STAIR_RAILING",
                "label": "Korkuluk Sakla/Göster",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-13870-212062372",
                "commandId": 13870,
                "symbol": "CM_EDIT_STAIR_BALUSTER_COUNT",
                "label": "Korkuluk Sayısı Değiştir",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-2562-212062908",
                "commandId": 2562,
                "symbol": "CM_SET_STAIR_BOUNDARY_CONDITIONS",
                "label": "Merdiven Mesnetlenme Koşullarını Belirle",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-13890-212063462",
                "commandId": 13890,
                "symbol": "CM_SAVE_STAIR",
                "label": "Merdiven Kaydet",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212063970",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-40207-212064130",
                "commandId": 40207,
                "symbol": "CM_INSERTION_POINT",
                "label": "Yerleştirme Noktası",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-13640-212064670",
                "commandId": 13640,
                "symbol": "CM_Y_MIRROR",
                "label": "Simetri Y",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212065191",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-62780-212065351",
                "commandId": 62780,
                "symbol": "CM_DRAW_NEW_STAIR_CONCRETE_LINES",
                "label": "Merdiven Betonarme Hesap Aksı Çiz",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-62781-212065921",
                "commandId": 62781,
                "symbol": "CM_EDIT_STAIR_CONCRETE_LINE",
                "label": "Merdiven Betonarme Hesap Aksını Değiştir",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-62782-212066493",
                "commandId": 62782,
                "symbol": "CM_DELETE_STAIR_CONCRETE_LINE",
                "label": "Merdiven Betonarme Hesap Aksını Sil",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212067060",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-13840-212067220",
                "commandId": 13840,
                "symbol": "CM_STAIR_SETTINGS",
                "label": "Merdiven Ayarları",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Betonarme-panel-4",
        "label": "Temel - Zemin",
        "commands": [
          {
            "id": "r25955-12690-212068136",
            "commandId": 12690,
            "symbol": "CM_DRAW_MULTI_FOUNDATION",
            "label": "Sürekli Temel",
            "large": true,
            "children": [
              {
                "id": "r25955-12700-212068614",
                "commandId": 12700,
                "symbol": "CM_SETTINGS_FOUNDATION",
                "label": "Sürekli Temel Ayarları",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-12710-212069195",
            "commandId": 12710,
            "symbol": "CM_DRAW_SINGULAR_FOUNDATION",
            "label": "Tekil Temel",
            "large": false,
            "children": [
              {
                "id": "r25955-12750-212069677",
                "commandId": 12750,
                "symbol": "CM_SETTINGS_SINGULAR_FOUNDATION",
                "label": "Tekil Temel Ayarları",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-14660-212070260",
            "commandId": 14660,
            "symbol": "CM_DRAW_PILE",
            "label": "Kazık",
            "large": false,
            "children": [
              {
                "id": "r25955-14680-212070728",
                "commandId": 14680,
                "symbol": "CM_PILE_SETTINGS",
                "label": "Kazık Ayarları",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-14170-212071312",
            "commandId": 14170,
            "symbol": "CM_DRAW_FOUNDATION_TIE",
            "label": "Temel Bağ Kirişi",
            "large": false,
            "children": [
              {
                "id": "r25955-14180-212071790",
                "commandId": 14180,
                "symbol": "CM_SETTINGS_FOUNDATION_TIE",
                "label": "Temel Bağ Kirişi Ayarları",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212072375",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-64485-212072520",
            "commandId": 64485,
            "symbol": "CM_DRAW_WELL_FOUNDATION",
            "label": "Kuyu Temel",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40563-212073050",
            "commandId": 40563,
            "symbol": "CM_DRAW_RETAINING_WALL",
            "label": "İstinat Duvarı",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212073522",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-12576-212073667",
            "commandId": 12576,
            "symbol": "CM_DRAW_RAFT_FOUNDATION",
            "label": "Radye",
            "large": true,
            "children": [
              {
                "id": "r25955-14212-212074150",
                "commandId": 14212,
                "symbol": "CM_RFCL_DELETE",
                "label": "Betonarme Hesap Aksı Sil",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-14241-212074674",
                "commandId": 14241,
                "symbol": "CM_DRAW_LINEAR_LOAD_RAFT_FOUNDATION",
                "label": "Çizgisel Radye Yükü",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-14231-212075232",
                "commandId": 14231,
                "symbol": "CM_DRAW_POINT_LOAD_RAFT_FOUNDATION",
                "label": "Noktasal Radye Yükü",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-13135-212075788",
                "commandId": 13135,
                "symbol": "CM_DRAW_RAFT_FOUNDATION_HOLE",
                "label": "Radye Boşluğu",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212076332",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-13275-212076548",
                "commandId": 13275,
                "symbol": "CM_SETTINGS_RAFT_FOUNDATION",
                "label": "Radye Ayarları",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-14192-212077142",
            "commandId": 14192,
            "symbol": "CM_GET_RAFT_FOUNDATION_CONCRETE_LINES",
            "label": "Betonarme Hesap Aksı Çiz",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-14205-212077629",
            "commandId": 14205,
            "symbol": "CM_RFCL_CHANGE_GEOMETRY",
            "label": "Donatı Hesap Aksı Geometrisi Değiştir",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-14204-212078102",
            "commandId": 14204,
            "symbol": "CM_RFCL_EDIT",
            "label": "Betonarme Hesap Aksı Edit",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-14351-212078581",
            "commandId": 14351,
            "symbol": "CM_DRAW_RAFT_EDGE",
            "label": "Radye Kenarı",
            "large": true,
            "children": [
              {
                "id": "r25955-14611-212079066",
                "commandId": 14611,
                "symbol": "CM_SETTINGS_RAFT_EDGE",
                "label": "Radye Kenarı Ayarları",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Betonarme-panel-5",
        "label": "İskele Ayarları",
        "commands": [
          {
            "id": "r25955-62088-212080016",
            "commandId": 62088,
            "symbol": "CM_CREATE_SCAFFOLDING",
            "label": "İskele Makrosu",
            "large": true,
            "children": [
              {
                "id": "r25955-62089-212080458",
                "commandId": 62089,
                "symbol": "CM_CREATE_SCAFFOLDING_ARC",
                "label": "Yay İskele Makrosu",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Betonarme-panel-6",
        "label": "Tasarım",
        "commands": [
          {
            "id": "r25955-11435-212081313",
            "commandId": 11435,
            "symbol": "CM_RIBBON_MENU_CONCRETE_DESIGN_DUMMY",
            "label": "Betonarme",
            "large": true,
            "children": [
              {
                "id": "r25955-12420-212081796",
                "commandId": 12420,
                "symbol": "CM_SLAB_CONCRETE_DIALOG",
                "label": "Döşeme",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12440-212082307",
                "commandId": 12440,
                "symbol": "CM_NERVUR_CONCRETE_DIALOG",
                "label": "Nervür",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12450-212082819",
                "commandId": 12450,
                "symbol": "CM_CASETTE_CONCRETE_DIALOG",
                "label": "Kaset",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12421-212083399",
                "commandId": 12421,
                "symbol": "CM_SLAB_WITH_MW_CONCRETE_DIALOG",
                "label": "Hasır Donatılı Döşeme",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212083937",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-12370-212084097",
                "commandId": 12370,
                "symbol": "CM_BEAM_CONCRETE_DIALOG",
                "label": "Kiriş",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12390-212084606",
                "commandId": 12390,
                "symbol": "CM_COLUMN_CONCRETE_DIALOG",
                "label": "Kolon",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12411-212085116",
                "commandId": 12411,
                "symbol": "CM_COLUMN_SUPPORT_CONCRETE_DIALOG",
                "label": "Kolon/Perde Zımbalama",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12460-212085651",
                "commandId": 12460,
                "symbol": "CM_PANEL_CONCRETE_DIALOG",
                "label": "Perde",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12391-212086160",
                "commandId": 12391,
                "symbol": "CM_SHEARWALL_CORE_GROUP_CONCRETE_DIALOG",
                "label": "Perde Grubu Betonarme",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212086721",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-12430-212086881",
                "commandId": 12430,
                "symbol": "CM_FOUND_SLAB_CONCRETE_DIALOG",
                "label": "Radye Temel",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12400-212087401",
                "commandId": 12400,
                "symbol": "CM_FOUND_CONCRETE_DIALOG",
                "label": "Sürekli Temel",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12410-212087919",
                "commandId": 12410,
                "symbol": "CM_SFOUND_CONCRETE_DIALOG",
                "label": "Tekil Temel",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12380-212088435",
                "commandId": 12380,
                "symbol": "CM_CONBEAM_CONCRETE_DIALOG",
                "label": "Temel Bağ Kirişi",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212088959",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-62790-212089119",
                "commandId": 62790,
                "symbol": "CM_STAIR_CONCRETE_DIALOG",
                "label": "Merdiven",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-65096-212089595",
                "commandId": 65096,
                "symbol": "CM_PILE_CONCRETE_DIALOG",
                "label": "Kazık",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-168-212090068",
                "commandId": 168,
                "symbol": "CM_DOME_CONCRETE_DIALOG",
                "label": "Kubbe",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212090538",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-64492-212090698",
                "commandId": 64492,
                "symbol": "CM_WELLFOUND_CONCRETE_DIALOG",
                "label": "Kuyu Temel",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-63384-212091180",
                "commandId": 63384,
                "symbol": "CM_RETWALL_CONCRETE_DIALOG",
                "label": "İstinat Duvarı",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-11436-212091717",
            "commandId": 11436,
            "symbol": "CM_RIBBON_MENU_STEEL_DESIGN_DUMMY",
            "label": "Çelik",
            "large": true,
            "children": [
              {
                "id": "r25955-174-212092194",
                "commandId": 174,
                "symbol": "CM_STEEL_COLUMN_DESIGN_DIALOG",
                "label": "Kolon",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-28013-212092706",
                "commandId": 28013,
                "symbol": "CM_STEEL_BEAM_DESIGN_DIALOG",
                "label": "Kiriş",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-28015-212093219",
                "commandId": 28015,
                "symbol": "CM_SECONDARY_STEEL_BEAM_DESIGN_DIALOG",
                "label": "Tali Kiriş",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-28051-212093747",
                "commandId": 28051,
                "symbol": "CM_CASTELLATED_BEAM_DESIGN_DIALOG",
                "label": "Kompozit Olmayan Petek Kiriş",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-28111-212094310",
                "commandId": 28111,
                "symbol": "CM_COMPOSITE_CASTELLATED_BEAM_DESIGN_DIALOG",
                "label": "Kompozit Petek Kiriş",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-28052-212094877",
                "commandId": 28052,
                "symbol": "CM_COMPOSITE_BEAM_DESIGN_DIALOG",
                "label": "Kompozit Kiriş",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-28054-212095403",
                "commandId": 28054,
                "symbol": "CM_CRANE_BEAM_DESIGN_DIALOG",
                "label": "Kren Kirişi",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-28043-212095922",
                "commandId": 28043,
                "symbol": "CM_STEEL_PURLIN_DESIGN_DIALOG",
                "label": "Aşık",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-28019-212096437",
                "commandId": 28019,
                "symbol": "CM_STEEL_BRACE_DESIGN_DIALOG",
                "label": "Çapraz",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-28021-212096952",
                "commandId": 28021,
                "symbol": "CM_STEEL_TRUSS_DESIGN_DIALOG",
                "label": "Makas",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-28056-212097465",
                "commandId": 28056,
                "symbol": "CM_SPACE_TRUSS_DESIGN_DIALOG",
                "label": "Uzay Kafes",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-28006-212097983",
                "commandId": 28006,
                "symbol": "CM_STEEL_JOIST_DESIGN_DIALOG",
                "label": "R Aşık",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-28007-212098501",
                "commandId": 28007,
                "symbol": "CM_SPACE_PURLIN_DESIGN_DIALOG",
                "label": "Uzay Aşık",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-28023-212099023",
                "commandId": 28023,
                "symbol": "CM_STEEL_CONNECTION_DESIGN_DIALOG",
                "label": "Birleşim",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212099545",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": true,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-28136-212099760",
                "commandId": 28136,
                "symbol": "CM_SELECT_MRF_MEMBERS",
                "label": "Moment Aktaran Çelik Çerçeve",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-28137-212100315",
                "commandId": 28137,
                "symbol": "CM_SELECT_CBF_MEMBERS",
                "label": "Merkezi Çaprazlı Çelik Çerçeve",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212100874",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-28005-212101034",
                "commandId": 28005,
                "symbol": "CM_PERFORM_CLASH_CHECK",
                "label": "Çakışma Kontrolü",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-14449-212101556",
                "commandId": 14449,
                "symbol": "CM_WELD_ELECTRODES",
                "label": "Kaynak Elektrotları",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Betonarme-panel-7",
        "label": "Raporlar",
        "commands": [
          {
            "id": "r25955-12270-212102445",
            "commandId": 12270,
            "symbol": "CM_ALL_STATIC_REPORTS",
            "label": "Seçmeli Raporlar",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12030-212102888",
            "commandId": 12030,
            "symbol": "CM_DYNAMIC_ANALYSIS_REPORT",
            "label": "Dinamik Analiz",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12050-212103328",
            "commandId": 12050,
            "symbol": "CM_STORY_FORCES_REPORT",
            "label": "Kat Kuvvetleri",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12220-212103764",
            "commandId": 12220,
            "symbol": "CM_DEPYON_GENERAL_REPORT",
            "label": "Deprem Yönetmeliği Genel Raporu",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212104222",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": true,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-11321-212104418",
            "commandId": 11321,
            "symbol": "CM_RIBBON_MENU_REPORTS_CONCRETE_DUMMY",
            "label": "Betonarme",
            "large": true,
            "children": [
              {
                "id": "r25955-12032-212104870",
                "commandId": 12032,
                "symbol": "CM_STRUCTURE_SUMMARY_REPORT",
                "label": "Yapı Özet Bilgileri",
                "large": true,
                "children": [
                  {
                    "id": "r25955-12033-212105368",
                    "commandId": 12033,
                    "symbol": "CM_ANALYSIS_SETTINGS_REPORT",
                    "label": "Analiz Ayarları Raporu",
                    "large": true,
                    "children": [],
                    "type": "Button"
                  },
                  {
                    "id": "r25955-12035-212105906",
                    "commandId": 12035,
                    "symbol": "CM_TBDY_2018_SEISMIC_PARAMETERS_REPORT",
                    "label": "TBDY 2018 Deprem Parametreleri Raporu",
                    "large": true,
                    "children": [],
                    "type": "Button"
                  },
                  {
                    "id": "r25955-12034-212106469",
                    "commandId": 12034,
                    "symbol": "CM_CONCRETE_DESIGN_REPORT",
                    "label": "Betonarme Tasarım Raporu",
                    "large": true,
                    "children": [],
                    "type": "Button"
                  }
                ],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212107066",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": true,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-40162-212107281",
                "commandId": 40162,
                "symbol": "CM_SLAB_GENERAL_REPORT",
                "label": "Döşeme",
                "large": true,
                "children": [
                  {
                    "id": "r25955-40161-212107761",
                    "commandId": 40161,
                    "symbol": "CM_SLAB_DETAILED_GENERAL_REPORT",
                    "label": "Döşeme",
                    "large": true,
                    "children": [],
                    "type": "Button"
                  },
                  {
                    "id": "r25955-40161-212108288",
                    "commandId": 40161,
                    "symbol": "CM_SLAB_DETAILED_GENERAL_REPORT",
                    "label": "Döşeme Detaylı",
                    "large": true,
                    "children": [],
                    "type": "Button"
                  },
                  {
                    "id": "r25955-12115-212108824",
                    "commandId": 12115,
                    "symbol": "CM_RIB_GENERAL_REPORT",
                    "label": "Nervür",
                    "large": true,
                    "children": [],
                    "type": "Button"
                  },
                  {
                    "id": "r25955-12125-212109380",
                    "commandId": 12125,
                    "symbol": "CM_WAFFLE_GENERAL_REPORT",
                    "label": "Kaset",
                    "large": true,
                    "children": [],
                    "type": "Button"
                  }
                ],
                "type": "Button"
              },
              {
                "id": "r25955-14440-212109996",
                "commandId": 14440,
                "symbol": "CM_BEAM_GENERAL_REPORT",
                "label": "Kiriş",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-14500-212110468",
                "commandId": 14500,
                "symbol": "CM_COLUMN_GENERAL_REPORT",
                "label": "Kolon",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12150-212110941",
                "commandId": 12150,
                "symbol": "CM_SHEARWALL_GENERAL_REPORT",
                "label": "Perde",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-28143-212111453",
                "commandId": 28143,
                "symbol": "CM_COMPOUND_SHEARWALL_REPORT",
                "label": "Perde Grubu",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212111938",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": true,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-40163-212112153",
                "commandId": 40163,
                "symbol": "CM_FOUNDATION_SLAB_GENERAL_REPORT",
                "label": "Radye Temel",
                "large": true,
                "children": [
                  {
                    "id": "r25955-40201-212112647",
                    "commandId": 40201,
                    "symbol": "CM_FOUNDATION_SLAB_DETAILED_GENERAL_REPORT",
                    "label": "Radye Temel Detaylı",
                    "large": true,
                    "children": [],
                    "type": "Button"
                  }
                ],
                "type": "Button"
              },
              {
                "id": "r25955-12186-212113256",
                "commandId": 12186,
                "symbol": "CM_STRIP_FOUNDATION_GENERAL_REPORT",
                "label": "Sürekli Temel Raporu",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12190-212113755",
                "commandId": 12190,
                "symbol": "CM_SINGULAR_FOUNDATION_REPORT",
                "label": "Tekil Temel",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-14778-212114239",
                "commandId": 14778,
                "symbol": "CM_PILE_GENERAL_REPORT",
                "label": "Kazık",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12200-212114711",
                "commandId": 12200,
                "symbol": "CM_FOUNDATION_TIE_REPORT",
                "label": "Temel Bağ Kirişi",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-65186-212115197",
                "commandId": 65186,
                "symbol": "CM_SEISMIC_ISOLATORS_REPORT",
                "label": "Deprem İzolatörleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212115689",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": true,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-12260-212115904",
                "commandId": 12260,
                "symbol": "CM_COLBEAM_JOIN_REPORT",
                "label": "Kolon-Kiriş Birleşim Güvenliği",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212116404",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": true,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-40164-212116619",
                "commandId": 40164,
                "symbol": "CM_STAIR_GENERAL_REPORT",
                "label": "Merdiven Genel Raporu",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-2592-212117107",
                "commandId": 2592,
                "symbol": "CM_DOMEVAULT_RESULTS_REPORT",
                "label": "Kubbe - Tonoz Sonuçları",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40574-212117602",
                "commandId": 40574,
                "symbol": "CM_RETWALL_CALC_REPORT",
                "label": "İstinat Duvarı",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-14786-212118084",
                "commandId": 14786,
                "symbol": "CM_WELL_FOUNDATION_REPORT",
                "label": "Kuyu Temel",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212118563",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": true,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-12210-212118778",
                "commandId": 12210,
                "symbol": "CM_MEASURE_REPORT",
                "label": "Metraj",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-11322-212119296",
            "commandId": 11322,
            "symbol": "CM_RIBBON_MENU_REPORTS_STEEL_DUMMY",
            "label": "Çelik",
            "large": true,
            "children": [
              {
                "id": "r25955-14504-212119742",
                "commandId": 14504,
                "symbol": "CM_EUROCODE_WIND_LOADS_REPORT",
                "label": "TS EN 1991-1-4  Rüzgar Yükleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212120247",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-14442-212120407",
                "commandId": 14442,
                "symbol": "CM_STEEL_COLUMN_REPORT",
                "label": "Çelik Kolon",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-14441-212120885",
                "commandId": 14441,
                "symbol": "CM_STEEL_BEAM_REPORT",
                "label": "Çelik Kiriş",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-14444-212121362",
                "commandId": 14444,
                "symbol": "CM_STEEL_SECONDARY_BEAM_REPORT",
                "label": "Tali Çelik Kiriş",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-14443-212121859",
                "commandId": 14443,
                "symbol": "CM_STEEL_PURLIN_REPORT",
                "label": "Çelik Aşık",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-14447-212122338",
                "commandId": 14447,
                "symbol": "CM_TRUSS_REPORT",
                "label": "Makas",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-14352-212122802",
                "commandId": 14352,
                "symbol": "CM_SPACE_TRUSS_REPORT",
                "label": "Uzay Kafes",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-14353-212123279",
                "commandId": 14353,
                "symbol": "CM_STEEL_JOIST_REPORT",
                "label": "R Aşık",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-14354-212123754",
                "commandId": 14354,
                "symbol": "CM_SPACE_PURLIN_REPORT",
                "label": "Uzay Aşık",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-14445-212124233",
                "commandId": 14445,
                "symbol": "CM_CONCENTRIC_BRACE_REPORT",
                "label": "Merkezi Çapraz",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-14446-212124718",
                "commandId": 14446,
                "symbol": "CM_ECCENTRIC_BRACE_REPORT",
                "label": "Dışmerkez Çapraz",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-14502-212125206",
                "commandId": 14502,
                "symbol": "CM_CRANE_REPORT",
                "label": "Kren Tasarım",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-28057-212125678",
                "commandId": 28057,
                "symbol": "CM_COMPOSITE_BEAM_REPORT",
                "label": "Kompozit Kiriş",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-28059-212126161",
                "commandId": 28059,
                "symbol": "CM_CASTELLATED_BEAM_REPORT",
                "label": "Petek Kiriş",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-28139-212126643",
                "commandId": 28139,
                "symbol": "CM_COMPOSITE_CASTELLATED_BEAM_REPORT",
                "label": "Kompozit Petek Kiriş",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-28079-212127146",
                "commandId": 28079,
                "symbol": "CM_CONNECTION_DESIGN_SUMMARY_REPORT",
                "label": "Birleşim",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212127634",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": true,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-14448-212127849",
                "commandId": 14448,
                "symbol": "CM_STEEL_SINGLEPART_ASSEMBLY_REPORT",
                "label": "Detaylı Çelik Metrajı",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Betonarme-panel-8",
        "label": "Çizim Oluştur",
        "commands": [
          {
            "id": "r25955-11307-212128731",
            "commandId": 11307,
            "symbol": "CM_DRAWINGS_CONCRETE_CATEGORY",
            "label": "Betonarme",
            "large": true,
            "children": [
              {
                "id": "r25955-11990-212129207",
                "commandId": 11990,
                "symbol": "CM_STATIC_PLAN",
                "label": "Kalıp Planı",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-2465-212129718",
                "commandId": 2465,
                "symbol": "CM_COLUMN_APPLICATION_PLAN2",
                "label": "Kolon Aplikasyon Planı",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-63387-212130211",
                "commandId": 63387,
                "symbol": "CM_PANEL_VERTICAL_DRAWINGS2",
                "label": "Perde Detayları",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-63386-212130734",
                "commandId": 63386,
                "symbol": "CM_COLUMN_VERTICAL_DRAWINGS2",
                "label": "Kolon Düşey Açılımları",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-63389-212131234",
                "commandId": 63389,
                "symbol": "CM_BEAM_DRAWINGS2",
                "label": "Kiriş Açılımları",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11960-212131752",
                "commandId": 11960,
                "symbol": "CM_NERVUR_DRAWINGS",
                "label": "Nervür Açılımları",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11970-212132272",
                "commandId": 11970,
                "symbol": "CM_CASETTE_DRAWINGS",
                "label": "Kaset Açılımları",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12000-212132795",
                "commandId": 12000,
                "symbol": "CM_FOUNDATION_APPLICATION_PLAN",
                "label": "Temel Aplikasyon Planı",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11980-212133328",
                "commandId": 11980,
                "symbol": "CM_FOUNDATION_DRAWINGS",
                "label": "Sürekli Temel Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11940-212133855",
                "commandId": 11940,
                "symbol": "CM_SFOUND_DRAWINGS",
                "label": "Tekil Temel Açılımları",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11930-212134379",
                "commandId": 11930,
                "symbol": "CM_CONBEAM_DRAWINGS",
                "label": "Temel Bağ Kirişi Açılımları",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11910-212134911",
                "commandId": 11910,
                "symbol": "CM_HORIZONTAL_COLBEAM_JOINT_SECTION",
                "label": "Kolon-Kiriş Birleşim Bölgesi Kesiti",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212135464",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-40572-212135624",
                "commandId": 40572,
                "symbol": "CM_RETAINING_WALL_DRAWINGS",
                "label": "İstinat Duvarı Açılımları",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-64495-212136125",
                "commandId": 64495,
                "symbol": "CM_WELL_FOUNDATION_DRAWINGS",
                "label": "Kuyu Temel Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-62791-212136617",
                "commandId": 62791,
                "symbol": "CM_STAIR_DRAWINGS",
                "label": "Merdiven Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-14088-212137097",
                "commandId": 14088,
                "symbol": "CM_PILE_DRAWINGS",
                "label": "Kazık Temel Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-112-212137580",
                "commandId": 112,
                "symbol": "CM_DOME_DRAWINGS",
                "label": "Kubbe Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-40880-212138105",
            "commandId": 40880,
            "symbol": "CM_CREATE_STEEL_DRAWING_GENERAL_CONSTRUCTION_WITH_PARTS",
            "label": "Çelik",
            "large": true,
            "children": [
              {
                "id": "r25955-40755-212138604",
                "commandId": 40755,
                "symbol": "CM_CREATE_STEEL_DRAWINGS",
                "label": "Çelik Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-846-212139125",
                "commandId": 846,
                "symbol": "CM_CREATE_POINT_DETAIL_GROUP_AUTO",
                "label": "Nokta Detayı Seçimi",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-1258-212139659",
                "commandId": 1258,
                "symbol": "CM_POINT_DETAILS_LIST",
                "label": "Nokta Detayı Listesi",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212140182",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-40870-212140342",
                "commandId": 40870,
                "symbol": "CM_CREATE_STEEL_DRAWING_SINGLE_PART",
                "label": "Tekil Eleman Çizimi",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40871-212140841",
                "commandId": 40871,
                "symbol": "CM_CREATE_STEEL_DRAWING_ASSEMBLY",
                "label": "Montaj Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40872-212141334",
                "commandId": 40872,
                "symbol": "CM_CREATE_STEEL_DRAWING_ASSEMBLY_WITH_SINGLE",
                "label": "Tekil Elemanlarla Montaj Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40873-212141857",
                "commandId": 40873,
                "symbol": "CM_CREATE_STEEL_DRAWING_COLUMN_ANCHORAGE",
                "label": "Kolon Ankraj Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40874-212142364",
                "commandId": 40874,
                "symbol": "CM_CREATE_STEEL_DRAWING_PLAN",
                "label": "Aplikasyon Planı Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40875-212142864",
                "commandId": 40875,
                "symbol": "CM_CREATE_STEEL_DRAWING_AXIS",
                "label": "Aks ve Cephe Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40876-212143359",
                "commandId": 40876,
                "symbol": "CM_CREATE_STEEL_DRAWING_ROOF_PLAN",
                "label": "Çatı Plan Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40877-212143858",
                "commandId": 40877,
                "symbol": "CM_CREATE_STEEL_DRAWING_TRUSS",
                "label": "Makas Çizimi",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40878-212144344",
                "commandId": 40878,
                "symbol": "CM_CREATE_STEEL_DRAWING_3D",
                "label": "3B İzometrik Görünüş Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40879-212144850",
                "commandId": 40879,
                "symbol": "CM_CREATE_STEEL_DRAWING_GENERAL_CONSTRUCTION",
                "label": "Genel Konstrüksiyon Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40880-212145369",
                "commandId": 40880,
                "symbol": "CM_CREATE_STEEL_DRAWING_GENERAL_CONSTRUCTION_WITH_PARTS",
                "label": "Genel Konstrüksiyon Çizimleri - Tekil Eleman ve Montajlar Dahil",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212145933",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-495-212146093",
                "commandId": 495,
                "symbol": "CM_CREATE_SCAFFOLDING_DRAWINGS",
                "label": "İskele Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Betonarme-panel-9",
        "label": "Analiz ve Tasarım Görüntüleme",
        "commands": [
          {
            "id": "r25955-12194-212146975",
            "commandId": 12194,
            "symbol": "CM_CHANGE_GL_VIEW_DETAIL_SOLID_WITH_EDGES",
            "label": "Katı Model",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-11820-212147647",
            "commandId": 11820,
            "symbol": "CM_VISUALIZATION_STRUCTURE",
            "label": "Analiz Modeli",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212148306",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": true,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-11832-212148502",
            "commandId": 11832,
            "symbol": "CM_VISUALIZATION_LOAD_WALL",
            "label": "Duvar",
            "large": true,
            "children": [
              {
                "id": "r25955-11847-212149159",
                "commandId": 11847,
                "symbol": "CM_VISUALIZATION_LOAD_OWN",
                "label": "Zati Yükler",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11848-212149880",
                "commandId": 11848,
                "symbol": "CM_VISUALIZATION_LOAD_SLAB_G",
                "label": "Döşeme Yükleri (G)",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11849-212150613",
                "commandId": 11849,
                "symbol": "CM_VISUALIZATION_LOAD_SLAB_Q",
                "label": "Döşeme Yükleri (Q)",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11831-212151346",
                "commandId": 11831,
                "symbol": "CM_VISUALIZATION_LOAD_USER",
                "label": "Kullanıcı Tanımlı Yükler",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212152085",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-11833-212152301",
                "commandId": 11833,
                "symbol": "CM_VISUALIZATION_LOAD_LIVE",
                "label": "Hareketli Yükler",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11834-212153028",
                "commandId": 11834,
                "symbol": "CM_VISUALIZATION_LOAD_WIND",
                "label": "Rüzgar Yükleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11835-212153754",
                "commandId": 11835,
                "symbol": "CM_VISUALIZATION_LOAD_SNOW",
                "label": "Kar Yükleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11851-212154476",
                "commandId": 11851,
                "symbol": "CM_VISUALIZATION_LOAD_SOIL",
                "label": "Toprak Yükleri",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212155252",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": true,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-11836-212155448",
            "commandId": 11836,
            "symbol": "CM_VISUALIZATION_DEFORMATION_MODAL",
            "label": "Modal",
            "large": true,
            "children": [
              {
                "id": "r25955-11837-212156113",
                "commandId": 11837,
                "symbol": "CM_VISUALIZATION_DEFORMATION_14G_16Q",
                "label": "1.4G+1.6Q",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-11840-212156893",
            "commandId": 11840,
            "symbol": "CM_VISUALIZATION_FRAME_MOMENT_3_3",
            "label": "Moment 3-3",
            "large": true,
            "children": [
              {
                "id": "r25955-11838-212157562",
                "commandId": 11838,
                "symbol": "CM_VISUALIZATION_FRAME_AXIAL_FORCE",
                "label": "Eksenel Kuvvet",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11839-212158294",
                "commandId": 11839,
                "symbol": "CM_VISUALIZATION_FRAME_SHEAR_2_2",
                "label": "Kesme kuvveti 2-2",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Betonarme-panel-10",
        "label": "Analiz",
        "commands": [
          {
            "id": "r25955-11760-212159392",
            "commandId": 11760,
            "symbol": "CM_COMPLETE_ANALYSIS",
            "label": "Analiz Tasarım",
            "large": true,
            "children": [
              {
                "id": "r25955-11800-212159865",
                "commandId": 11800,
                "symbol": "CM_SLAB_ANALYSIS",
                "label": "Döşeme Analizi",
                "large": false,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-2565-212160378",
                "commandId": 2565,
                "symbol": "CM_STAIR_ANALYSIS",
                "label": "Merdiven Analizi",
                "large": false,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40594-212160891",
                "commandId": 40594,
                "symbol": "CM_POOL_ANALYSIS",
                "label": "Havuz Analizi",
                "large": false,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-2587-212161401",
                "commandId": 2587,
                "symbol": "CM_DOMEVAULT_ANALYSIS",
                "label": "Kubbe ve Tonoz Analizi",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212161944",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-40570-212162104",
                "commandId": 40570,
                "symbol": "CM_RETWALL_ANALYSIS",
                "label": "İstinat Duvarı Analizi",
                "large": false,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-64486-212162628",
                "commandId": 64486,
                "symbol": "CM_WELLFOUND_ANALYSIS",
                "label": "Kuyu Temel Analizi",
                "large": false,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212163152",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-15171-212163312",
                "commandId": 15171,
                "symbol": "CM_PUSHOVER_ANALYSIS",
                "label": "Nonlineer İtme Analizi",
                "large": false,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40556-212163836",
                "commandId": 40556,
                "symbol": "CM_LINEAR_PERFORMANCE_ANALYSIS",
                "label": "Doğrusal Performans Analizi",
                "large": false,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40557-212164375",
                "commandId": 40557,
                "symbol": "CM_RISKY_STRUCTURE_ANALYSIS",
                "label": "Riskli Bina Analizi",
                "large": false,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212164902",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": true,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-13701-212165117",
                "commandId": 13701,
                "symbol": "CM_MODIFY_FINITE_ELEMENT_MESH_SIZES",
                "label": "Sonlu Eleman Genişliklerini Değiştir",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212165673",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": true,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-11880-212165888",
                "commandId": 11880,
                "symbol": "CM_AUTO_SYSTEM_GENERATION",
                "label": "Otomatik Analiz Sistemi Oluşturulması",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11890-212166432",
                "commandId": 11890,
                "symbol": "CM_GENERATE_ANALYSIS_SYSTEM",
                "label": "Analiz Sistemi Oluştur",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212166962",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": true,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-11711-212167177",
                "commandId": 11711,
                "symbol": "CM_GROUND_MOTION_SCALING_IN_TIME_DOMAIN",
                "label": "Yer Hareketi Ölçekleme",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-28141-212167743",
                "commandId": 28141,
                "symbol": "CM_GROUND_MOTION_RECORDS_FOR_MODE_SUPERPOSITION",
                "label": "Deprem Yer Hareketi Kayıtları",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          }
        ]
      }
    ]
  },
  {
    "id": "Çelik",
    "label": "Çelik",
    "panels": [
      {
        "id": "r25955-Çelik-panel-0",
        "label": "Proje Ayarları",
        "commands": [
          {
            "id": "r25955-11710-212169178",
            "commandId": 11710,
            "symbol": "CM_ANALYSIS_SETTINGS",
            "label": "Analiz Ayarları",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-15700-212169646",
            "commandId": 15700,
            "symbol": "CM_RIBBON_MENU_WINDOW_LIST_STORIES",
            "label": "Kat listesi",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-11240-212170091",
            "commandId": 11240,
            "symbol": "CM_STORY_SETTINGS",
            "label": "Kat Genel Ayarları",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12500-212170557",
            "commandId": 12500,
            "symbol": "CM_FAST_COPY",
            "label": "Kat Kopyala",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40350-212171011",
            "commandId": 40350,
            "symbol": "CM_CHECK_SEMI_RIGID",
            "label": "Yarı Rijit",
            "large": false,
            "children": [],
            "type": "Button_Check"
          }
        ]
      },
      {
        "id": "r25955-Çelik-panel-1",
        "label": "Aks",
        "commands": [
          {
            "id": "r25955-12590-212171893",
            "commandId": 12590,
            "symbol": "CM_DRAW_AXIS",
            "label": "Aks",
            "large": true,
            "children": [
              {
                "id": "r25955-13980-212172344",
                "commandId": 13980,
                "symbol": "CM_CALCULATE_CONTOUR",
                "label": "Kontur Hesapla",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12660-212172858",
                "commandId": 12660,
                "symbol": "CM_SETTINGS_CONTOUR",
                "label": "Kontur Çizgileri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12673-212173372",
                "commandId": 12673,
                "symbol": "CM_MOVE_AXIS_LABEL",
                "label": "Aks Etiketini Taşı",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212173891",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-12580-212174107",
                "commandId": 12580,
                "symbol": "CM_SETTINGS_AXIS",
                "label": "Aks Ayarları",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-40071-212174667",
            "commandId": 40071,
            "symbol": "CM_DRAW_ARC_AXIS",
            "label": "Yay Aks",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40072-212175133",
            "commandId": 40072,
            "symbol": "CM_DRAW_ARC_AXIS_3P",
            "label": "3 Noktadan Yay Aks",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12671-212175602",
            "commandId": 12671,
            "symbol": "CM_AXIS_DRAW_TYPE",
            "label": "Aks Çizim Tipini Değiştir",
            "large": false,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Çelik-panel-2",
        "label": "Çelik",
        "commands": [
          {
            "id": "r25955-62829-212176400",
            "commandId": 62829,
            "symbol": "CM_DRAW_STEEL_COLUMN",
            "label": "Kolon",
            "large": true,
            "children": [
              {
                "id": "r25955-62845-212176863",
                "commandId": 62845,
                "symbol": "CM_DRAW_STEEL_COLUMN_TWO_POINTS",
                "label": "Çelik Kolon 2 Nokta",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-62830-212177466",
            "commandId": 62830,
            "symbol": "CM_DRAW_STEEL_BEAM",
            "label": "Kiriş",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-39545-212177922",
            "commandId": 39545,
            "symbol": "CM_DRAW_STEEL_BRACE",
            "label": "Çapraz",
            "large": true,
            "children": [
              {
                "id": "r25955-39546-212178354",
                "commandId": 39546,
                "symbol": "CM_DRAW_STEEL_BRACE_MULTIPLE_ELEMENTS",
                "label": "Çelik çapraz (Çoklu eleman)",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-60015-212178922",
                "commandId": 60015,
                "symbol": "CM_DRAW_SINGLE_STEEL_BRACE",
                "label": "Tek Çelik Çapraz",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-60005-212179518",
            "commandId": 60005,
            "symbol": "CM_DRAW_SECONDARY_STEEL_BEAM",
            "label": "Tali Kiriş",
            "large": true,
            "children": [
              {
                "id": "r25955-254-212180012",
                "commandId": 254,
                "symbol": "CM_DRAW_SINGLE_SECONDARY_BEAM",
                "label": "Tek Tali Çelik Kiriş",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-62831-212180613",
            "commandId": 62831,
            "symbol": "CM_DRAW_STEEL_PURLIN",
            "label": "Aşık",
            "large": true,
            "children": [
              {
                "id": "r25955-1131-212181096",
                "commandId": 1131,
                "symbol": "CM_DRAW_STEEL_TIE",
                "label": "Çelik Kuşak",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-60011-212181626",
                "commandId": 60011,
                "symbol": "CM_DRAW_SINGLE_PURLIN",
                "label": "Tek Aşık",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-671-212182158",
                "commandId": 671,
                "symbol": "CM_DRAW_SPACE_PURLIN",
                "label": "Uzay Aşık",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-673-212182688",
                "commandId": 673,
                "symbol": "CM_DRAW_STEEL_JOIST",
                "label": "R Aşık",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-13158-212183214",
                "commandId": 13158,
                "symbol": "CM_PURLIN_ADD_TO_ANALYSIS",
                "label": "Analiz Parçalarını Seç",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212183766",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": true,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-12971-212183981",
                "commandId": 12971,
                "symbol": "CM_PURLIN_DIVIDE_COMBINE_ALL",
                "label": "Tüm Kesişimleri Birleştir-Böl",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12991-212184543",
                "commandId": 12991,
                "symbol": "CM_PURLIN_DIVIDE_COMBINE_SINGLE",
                "label": "Tek Keşisim Böl-Birleştir",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-60004-212185154",
            "commandId": 60004,
            "symbol": "CM_DRAW_SAG_ROD_BETWEEN_PURLIN_GROUP",
            "label": "Gergi",
            "large": true,
            "children": [
              {
                "id": "r25955-609-212185601",
                "commandId": 609,
                "symbol": "CM_DRAW_SAG_ROD_BETWEEN_SINGLE_PURLINS",
                "label": "Tek Aşıkta Gergi Çubuğu",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-60003-212186165",
                "commandId": 60003,
                "symbol": "CM_DRAW_SAG_ROD_BETWEEN_ROOF_PURLINS",
                "label": "Çatı Aşıkları İçin Gergi Çubuğu",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-60007-212186793",
            "commandId": 60007,
            "symbol": "CM_DRAW_COMPOSITE_DECK_SLAB",
            "label": "Döşeme",
            "large": true,
            "children": [
              {
                "id": "r25955-60012-212187234",
                "commandId": 60012,
                "symbol": "CM_DRAW_COMPOSITE_SOLID_SLAB",
                "label": "Kompozit Yekpare Döşeme",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-60013-212187788",
                "commandId": 60013,
                "symbol": "CM_DRAW_NONCOMPOSITE_SOLID_SLAB",
                "label": "Beton Döşeme",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-60021-212188334",
                "commandId": 60021,
                "symbol": "CM_DRAW_METAL_SLAB",
                "label": "Metal Döşeme",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-62832-212188918",
            "commandId": 62832,
            "symbol": "CM_DRAW_SHEETING_OVERPURLIN",
            "label": "Kaplama",
            "large": true,
            "children": [
              {
                "id": "r25955-60009-212189358",
                "commandId": 60009,
                "symbol": "CM_DRAW_SHEETING_POLYGON",
                "label": "Poligonal Kaplama",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-60008-212189900",
                "commandId": 60008,
                "symbol": "CM_DRAW_SHEETING_TWOELEMENTS",
                "label": "Elemanlar Arası Kaplama",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Çelik-panel-3",
        "label": "Makro",
        "commands": [
          {
            "id": "r25955-65200-212190817",
            "commandId": 65200,
            "symbol": "CM_DRAW_TRUSS2",
            "label": "Makas",
            "large": true,
            "children": [
              {
                "id": "r25955-21050-212191274",
                "commandId": 21050,
                "symbol": "CM_DRAW_TRUSS2_TYPE00",
                "label": "Trapez Tip 1",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-21054-212191808",
                "commandId": 21054,
                "symbol": "CM_DRAW_TRUSS2_TYPE10",
                "label": "Trapez Tip 2",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-21058-212192342",
                "commandId": 21058,
                "symbol": "CM_DRAW_TRUSS2_TYPE20",
                "label": "Soldan Trapez Eğimli",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-21062-212192885",
                "commandId": 21062,
                "symbol": "CM_DRAW_TRUSS2_TYPE30",
                "label": "Sağdan Trapez Eğimli",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212193429",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-21051-212193645",
                "commandId": 21051,
                "symbol": "CM_DRAW_TRUSS2_TYPE01",
                "label": "Üçgen Simetrik",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-21055-212194183",
                "commandId": 21055,
                "symbol": "CM_DRAW_TRUSS2_TYPE11",
                "label": "Üçgen Asimetrik",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-21059-212194722",
                "commandId": 21059,
                "symbol": "CM_DRAW_TRUSS2_TYPE21",
                "label": "Soldan Üçgen Eğimli",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-21063-212195266",
                "commandId": 21063,
                "symbol": "CM_DRAW_TRUSS2_TYPE31",
                "label": "Sağdan Üçgen Eğimli",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212195811",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-21052-212196027",
                "commandId": 21052,
                "symbol": "CM_DRAW_TRUSS2_TYPE02",
                "label": "Simetrik Eğimli Trapez",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-21056-212196573",
                "commandId": 21056,
                "symbol": "CM_DRAW_TRUSS2_TYPE12",
                "label": "Asimetrik Eğimli Trapez",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-21060-212197119",
                "commandId": 21060,
                "symbol": "CM_DRAW_TRUSS2_TYPE22",
                "label": "Düz",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-21064-212197645",
                "commandId": 21064,
                "symbol": "CM_DRAW_TRUSS2_TYPE32",
                "label": "Eğimli  Düz",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212198180",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-21053-212198396",
                "commandId": 21053,
                "symbol": "CM_DRAW_TRUSS2_TYPE03",
                "label": "Trapez Tonoz",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-21057-212198930",
                "commandId": 21057,
                "symbol": "CM_DRAW_TRUSS2_TYPE13",
                "label": "Tonoz",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-21061-212199436",
                "commandId": 21061,
                "symbol": "CM_DRAW_TRUSS2_TYPE23",
                "label": "Çift Tonoz",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-21065-212199969",
                "commandId": 21065,
                "symbol": "CM_DRAW_TRUSS2_TYPE33",
                "label": "Eğimli Tonoz",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-62083-212200555",
            "commandId": 62083,
            "symbol": "CM_DRAW_SPACE_TRUSS",
            "label": "Uzay Kafes",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-64389-212200984",
            "commandId": 64389,
            "symbol": "CM_DRAW_CRANE",
            "label": "Kren",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-62087-212201401",
            "commandId": 62087,
            "symbol": "CM_CREATE_HALL",
            "label": "Hol",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-62094-212201818",
            "commandId": 62094,
            "symbol": "CM_CREATE_STEEL_STAIR",
            "label": "Merdiven",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-62092-212202296",
            "commandId": 62092,
            "symbol": "CM_CREATE_SHANDRAIL",
            "label": "Korkuluk",
            "large": true,
            "children": [
              {
                "id": "r25955-62096-212202729",
                "commandId": 62096,
                "symbol": "CM_CREATE_SHANDRAIL_LINE",
                "label": "Düz Çelik Korkuluk",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-62097-212203274",
                "commandId": 62097,
                "symbol": "CM_CREATE_SHANDRAIL_ARC",
                "label": "Yay Çelik Korkuluk",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Çelik-panel-4",
        "label": "Tasarım",
        "commands": [
          {
            "id": "r25955-11435-212204184",
            "commandId": 11435,
            "symbol": "CM_RIBBON_MENU_CONCRETE_DESIGN_DUMMY",
            "label": "Betonarme",
            "large": true,
            "children": [
              {
                "id": "r25955-12420-212204667",
                "commandId": 12420,
                "symbol": "CM_SLAB_CONCRETE_DIALOG",
                "label": "Döşeme",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12440-212205178",
                "commandId": 12440,
                "symbol": "CM_NERVUR_CONCRETE_DIALOG",
                "label": "Nervür",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12450-212205690",
                "commandId": 12450,
                "symbol": "CM_CASETTE_CONCRETE_DIALOG",
                "label": "Kaset",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12421-212206270",
                "commandId": 12421,
                "symbol": "CM_SLAB_WITH_MW_CONCRETE_DIALOG",
                "label": "Hasır Donatılı Döşeme",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212206808",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-12370-212206968",
                "commandId": 12370,
                "symbol": "CM_BEAM_CONCRETE_DIALOG",
                "label": "Kiriş",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12390-212207477",
                "commandId": 12390,
                "symbol": "CM_COLUMN_CONCRETE_DIALOG",
                "label": "Kolon",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12411-212207987",
                "commandId": 12411,
                "symbol": "CM_COLUMN_SUPPORT_CONCRETE_DIALOG",
                "label": "Kolon/Perde Zımbalama",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12460-212208522",
                "commandId": 12460,
                "symbol": "CM_PANEL_CONCRETE_DIALOG",
                "label": "Perde",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12391-212209031",
                "commandId": 12391,
                "symbol": "CM_SHEARWALL_CORE_GROUP_CONCRETE_DIALOG",
                "label": "Perde Grubu Betonarme",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212209592",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-12430-212209752",
                "commandId": 12430,
                "symbol": "CM_FOUND_SLAB_CONCRETE_DIALOG",
                "label": "Radye Temel",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12400-212210272",
                "commandId": 12400,
                "symbol": "CM_FOUND_CONCRETE_DIALOG",
                "label": "Sürekli Temel",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12410-212210790",
                "commandId": 12410,
                "symbol": "CM_SFOUND_CONCRETE_DIALOG",
                "label": "Tekil Temel",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12380-212211306",
                "commandId": 12380,
                "symbol": "CM_CONBEAM_CONCRETE_DIALOG",
                "label": "Temel Bağ Kirişi",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212211830",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-62790-212211990",
                "commandId": 62790,
                "symbol": "CM_STAIR_CONCRETE_DIALOG",
                "label": "Merdiven",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-65096-212212466",
                "commandId": 65096,
                "symbol": "CM_PILE_CONCRETE_DIALOG",
                "label": "Kazık",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-168-212212939",
                "commandId": 168,
                "symbol": "CM_DOME_CONCRETE_DIALOG",
                "label": "Kubbe",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212213409",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-64492-212213569",
                "commandId": 64492,
                "symbol": "CM_WELLFOUND_CONCRETE_DIALOG",
                "label": "Kuyu Temel",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-63384-212214051",
                "commandId": 63384,
                "symbol": "CM_RETWALL_CONCRETE_DIALOG",
                "label": "İstinat Duvarı",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-11436-212214588",
            "commandId": 11436,
            "symbol": "CM_RIBBON_MENU_STEEL_DESIGN_DUMMY",
            "label": "Çelik",
            "large": true,
            "children": [
              {
                "id": "r25955-174-212215065",
                "commandId": 174,
                "symbol": "CM_STEEL_COLUMN_DESIGN_DIALOG",
                "label": "Kolon",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-28013-212215577",
                "commandId": 28013,
                "symbol": "CM_STEEL_BEAM_DESIGN_DIALOG",
                "label": "Kiriş",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-28015-212216090",
                "commandId": 28015,
                "symbol": "CM_SECONDARY_STEEL_BEAM_DESIGN_DIALOG",
                "label": "Tali Kiriş",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-28051-212216618",
                "commandId": 28051,
                "symbol": "CM_CASTELLATED_BEAM_DESIGN_DIALOG",
                "label": "Kompozit Olmayan Petek Kiriş",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-28111-212217181",
                "commandId": 28111,
                "symbol": "CM_COMPOSITE_CASTELLATED_BEAM_DESIGN_DIALOG",
                "label": "Kompozit Petek Kiriş",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-28052-212217748",
                "commandId": 28052,
                "symbol": "CM_COMPOSITE_BEAM_DESIGN_DIALOG",
                "label": "Kompozit Kiriş",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-28054-212218274",
                "commandId": 28054,
                "symbol": "CM_CRANE_BEAM_DESIGN_DIALOG",
                "label": "Kren Kirişi",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-28043-212218793",
                "commandId": 28043,
                "symbol": "CM_STEEL_PURLIN_DESIGN_DIALOG",
                "label": "Aşık",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-28019-212219308",
                "commandId": 28019,
                "symbol": "CM_STEEL_BRACE_DESIGN_DIALOG",
                "label": "Çapraz",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-28021-212219823",
                "commandId": 28021,
                "symbol": "CM_STEEL_TRUSS_DESIGN_DIALOG",
                "label": "Makas",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-28056-212220336",
                "commandId": 28056,
                "symbol": "CM_SPACE_TRUSS_DESIGN_DIALOG",
                "label": "Uzay Kafes",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-28006-212220854",
                "commandId": 28006,
                "symbol": "CM_STEEL_JOIST_DESIGN_DIALOG",
                "label": "R Aşık",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-28007-212221372",
                "commandId": 28007,
                "symbol": "CM_SPACE_PURLIN_DESIGN_DIALOG",
                "label": "Uzay Aşık",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-28023-212221894",
                "commandId": 28023,
                "symbol": "CM_STEEL_CONNECTION_DESIGN_DIALOG",
                "label": "Birleşim",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212222416",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": true,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-28136-212222631",
                "commandId": 28136,
                "symbol": "CM_SELECT_MRF_MEMBERS",
                "label": "Moment Aktaran Çelik Çerçeve",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-28137-212223186",
                "commandId": 28137,
                "symbol": "CM_SELECT_CBF_MEMBERS",
                "label": "Merkezi Çaprazlı Çelik Çerçeve",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212223745",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-28005-212223905",
                "commandId": 28005,
                "symbol": "CM_PERFORM_CLASH_CHECK",
                "label": "Çakışma Kontrolü",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-14449-212224427",
                "commandId": 14449,
                "symbol": "CM_WELD_ELECTRODES",
                "label": "Kaynak Elektrotları",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Çelik-panel-5",
        "label": "Raporlar",
        "commands": [
          {
            "id": "r25955-12270-212225316",
            "commandId": 12270,
            "symbol": "CM_ALL_STATIC_REPORTS",
            "label": "Seçmeli Raporlar",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12030-212225759",
            "commandId": 12030,
            "symbol": "CM_DYNAMIC_ANALYSIS_REPORT",
            "label": "Dinamik Analiz",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12050-212226199",
            "commandId": 12050,
            "symbol": "CM_STORY_FORCES_REPORT",
            "label": "Kat Kuvvetleri",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12220-212226635",
            "commandId": 12220,
            "symbol": "CM_DEPYON_GENERAL_REPORT",
            "label": "Deprem Yönetmeliği Genel Raporu",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212227093",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": true,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-11321-212227289",
            "commandId": 11321,
            "symbol": "CM_RIBBON_MENU_REPORTS_CONCRETE_DUMMY",
            "label": "Betonarme",
            "large": true,
            "children": [
              {
                "id": "r25955-12032-212227741",
                "commandId": 12032,
                "symbol": "CM_STRUCTURE_SUMMARY_REPORT",
                "label": "Yapı Özet Bilgileri",
                "large": true,
                "children": [
                  {
                    "id": "r25955-12033-212228239",
                    "commandId": 12033,
                    "symbol": "CM_ANALYSIS_SETTINGS_REPORT",
                    "label": "Analiz Ayarları Raporu",
                    "large": true,
                    "children": [],
                    "type": "Button"
                  },
                  {
                    "id": "r25955-12035-212228777",
                    "commandId": 12035,
                    "symbol": "CM_TBDY_2018_SEISMIC_PARAMETERS_REPORT",
                    "label": "TBDY 2018 Deprem Parametreleri Raporu",
                    "large": true,
                    "children": [],
                    "type": "Button"
                  },
                  {
                    "id": "r25955-12034-212229340",
                    "commandId": 12034,
                    "symbol": "CM_CONCRETE_DESIGN_REPORT",
                    "label": "Betonarme Tasarım Raporu",
                    "large": true,
                    "children": [],
                    "type": "Button"
                  }
                ],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212229937",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": true,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-40162-212230152",
                "commandId": 40162,
                "symbol": "CM_SLAB_GENERAL_REPORT",
                "label": "Döşeme",
                "large": true,
                "children": [
                  {
                    "id": "r25955-40161-212230632",
                    "commandId": 40161,
                    "symbol": "CM_SLAB_DETAILED_GENERAL_REPORT",
                    "label": "Döşeme",
                    "large": true,
                    "children": [],
                    "type": "Button"
                  },
                  {
                    "id": "r25955-40161-212231159",
                    "commandId": 40161,
                    "symbol": "CM_SLAB_DETAILED_GENERAL_REPORT",
                    "label": "Döşeme Detaylı",
                    "large": true,
                    "children": [],
                    "type": "Button"
                  },
                  {
                    "id": "r25955-12115-212231695",
                    "commandId": 12115,
                    "symbol": "CM_RIB_GENERAL_REPORT",
                    "label": "Nervür",
                    "large": true,
                    "children": [],
                    "type": "Button"
                  },
                  {
                    "id": "r25955-12125-212232251",
                    "commandId": 12125,
                    "symbol": "CM_WAFFLE_GENERAL_REPORT",
                    "label": "Kaset",
                    "large": true,
                    "children": [],
                    "type": "Button"
                  }
                ],
                "type": "Button"
              },
              {
                "id": "r25955-14440-212232867",
                "commandId": 14440,
                "symbol": "CM_BEAM_GENERAL_REPORT",
                "label": "Kiriş",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-14500-212233339",
                "commandId": 14500,
                "symbol": "CM_COLUMN_GENERAL_REPORT",
                "label": "Kolon",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12150-212233812",
                "commandId": 12150,
                "symbol": "CM_SHEARWALL_GENERAL_REPORT",
                "label": "Perde",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-28143-212234324",
                "commandId": 28143,
                "symbol": "CM_COMPOUND_SHEARWALL_REPORT",
                "label": "Perde Grubu",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212234809",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": true,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-40163-212235024",
                "commandId": 40163,
                "symbol": "CM_FOUNDATION_SLAB_GENERAL_REPORT",
                "label": "Radye Temel",
                "large": true,
                "children": [
                  {
                    "id": "r25955-40201-212235518",
                    "commandId": 40201,
                    "symbol": "CM_FOUNDATION_SLAB_DETAILED_GENERAL_REPORT",
                    "label": "Radye Temel Detaylı",
                    "large": true,
                    "children": [],
                    "type": "Button"
                  }
                ],
                "type": "Button"
              },
              {
                "id": "r25955-12186-212236127",
                "commandId": 12186,
                "symbol": "CM_STRIP_FOUNDATION_GENERAL_REPORT",
                "label": "Sürekli Temel Raporu",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12190-212236626",
                "commandId": 12190,
                "symbol": "CM_SINGULAR_FOUNDATION_REPORT",
                "label": "Tekil Temel",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-14778-212237110",
                "commandId": 14778,
                "symbol": "CM_PILE_GENERAL_REPORT",
                "label": "Kazık",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12200-212237582",
                "commandId": 12200,
                "symbol": "CM_FOUNDATION_TIE_REPORT",
                "label": "Temel Bağ Kirişi",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-65186-212238068",
                "commandId": 65186,
                "symbol": "CM_SEISMIC_ISOLATORS_REPORT",
                "label": "Deprem İzolatörleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212238560",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": true,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-12260-212238775",
                "commandId": 12260,
                "symbol": "CM_COLBEAM_JOIN_REPORT",
                "label": "Kolon-Kiriş Birleşim Güvenliği",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212239275",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": true,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-40164-212239490",
                "commandId": 40164,
                "symbol": "CM_STAIR_GENERAL_REPORT",
                "label": "Merdiven Genel Raporu",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-2592-212239978",
                "commandId": 2592,
                "symbol": "CM_DOMEVAULT_RESULTS_REPORT",
                "label": "Kubbe - Tonoz Sonuçları",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40574-212240473",
                "commandId": 40574,
                "symbol": "CM_RETWALL_CALC_REPORT",
                "label": "İstinat Duvarı",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-14786-212240955",
                "commandId": 14786,
                "symbol": "CM_WELL_FOUNDATION_REPORT",
                "label": "Kuyu Temel",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212241434",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": true,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-12210-212241649",
                "commandId": 12210,
                "symbol": "CM_MEASURE_REPORT",
                "label": "Metraj",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-11322-212242167",
            "commandId": 11322,
            "symbol": "CM_RIBBON_MENU_REPORTS_STEEL_DUMMY",
            "label": "Çelik",
            "large": true,
            "children": [
              {
                "id": "r25955-14504-212242613",
                "commandId": 14504,
                "symbol": "CM_EUROCODE_WIND_LOADS_REPORT",
                "label": "TS EN 1991-1-4  Rüzgar Yükleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212243118",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-14442-212243278",
                "commandId": 14442,
                "symbol": "CM_STEEL_COLUMN_REPORT",
                "label": "Çelik Kolon",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-14441-212243756",
                "commandId": 14441,
                "symbol": "CM_STEEL_BEAM_REPORT",
                "label": "Çelik Kiriş",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-14444-212244233",
                "commandId": 14444,
                "symbol": "CM_STEEL_SECONDARY_BEAM_REPORT",
                "label": "Tali Çelik Kiriş",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-14443-212244730",
                "commandId": 14443,
                "symbol": "CM_STEEL_PURLIN_REPORT",
                "label": "Çelik Aşık",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-14447-212245209",
                "commandId": 14447,
                "symbol": "CM_TRUSS_REPORT",
                "label": "Makas",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-14352-212245673",
                "commandId": 14352,
                "symbol": "CM_SPACE_TRUSS_REPORT",
                "label": "Uzay Kafes",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-14353-212246150",
                "commandId": 14353,
                "symbol": "CM_STEEL_JOIST_REPORT",
                "label": "R Aşık",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-14354-212246625",
                "commandId": 14354,
                "symbol": "CM_SPACE_PURLIN_REPORT",
                "label": "Uzay Aşık",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-14445-212247104",
                "commandId": 14445,
                "symbol": "CM_CONCENTRIC_BRACE_REPORT",
                "label": "Merkezi Çapraz",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-14446-212247589",
                "commandId": 14446,
                "symbol": "CM_ECCENTRIC_BRACE_REPORT",
                "label": "Dışmerkez Çapraz",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-14502-212248077",
                "commandId": 14502,
                "symbol": "CM_CRANE_REPORT",
                "label": "Kren Tasarım",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-28057-212248549",
                "commandId": 28057,
                "symbol": "CM_COMPOSITE_BEAM_REPORT",
                "label": "Kompozit Kiriş",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-28059-212249032",
                "commandId": 28059,
                "symbol": "CM_CASTELLATED_BEAM_REPORT",
                "label": "Petek Kiriş",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-28139-212249514",
                "commandId": 28139,
                "symbol": "CM_COMPOSITE_CASTELLATED_BEAM_REPORT",
                "label": "Kompozit Petek Kiriş",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-28079-212250017",
                "commandId": 28079,
                "symbol": "CM_CONNECTION_DESIGN_SUMMARY_REPORT",
                "label": "Birleşim",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212250505",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": true,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-14448-212250720",
                "commandId": 14448,
                "symbol": "CM_STEEL_SINGLEPART_ASSEMBLY_REPORT",
                "label": "Detaylı Çelik Metrajı",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Çelik-panel-6",
        "label": "Çizim Oluştur",
        "commands": [
          {
            "id": "r25955-11307-212251602",
            "commandId": 11307,
            "symbol": "CM_DRAWINGS_CONCRETE_CATEGORY",
            "label": "Betonarme",
            "large": true,
            "children": [
              {
                "id": "r25955-11990-212252078",
                "commandId": 11990,
                "symbol": "CM_STATIC_PLAN",
                "label": "Kalıp Planı",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-2465-212252589",
                "commandId": 2465,
                "symbol": "CM_COLUMN_APPLICATION_PLAN2",
                "label": "Kolon Aplikasyon Planı",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-63387-212253082",
                "commandId": 63387,
                "symbol": "CM_PANEL_VERTICAL_DRAWINGS2",
                "label": "Perde Detayları",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-63386-212253605",
                "commandId": 63386,
                "symbol": "CM_COLUMN_VERTICAL_DRAWINGS2",
                "label": "Kolon Düşey Açılımları",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-63389-212254105",
                "commandId": 63389,
                "symbol": "CM_BEAM_DRAWINGS2",
                "label": "Kiriş Açılımları",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11960-212254623",
                "commandId": 11960,
                "symbol": "CM_NERVUR_DRAWINGS",
                "label": "Nervür Açılımları",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11970-212255143",
                "commandId": 11970,
                "symbol": "CM_CASETTE_DRAWINGS",
                "label": "Kaset Açılımları",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12000-212255666",
                "commandId": 12000,
                "symbol": "CM_FOUNDATION_APPLICATION_PLAN",
                "label": "Temel Aplikasyon Planı",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11980-212256199",
                "commandId": 11980,
                "symbol": "CM_FOUNDATION_DRAWINGS",
                "label": "Sürekli Temel Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11940-212256726",
                "commandId": 11940,
                "symbol": "CM_SFOUND_DRAWINGS",
                "label": "Tekil Temel Açılımları",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11930-212257250",
                "commandId": 11930,
                "symbol": "CM_CONBEAM_DRAWINGS",
                "label": "Temel Bağ Kirişi Açılımları",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11910-212257782",
                "commandId": 11910,
                "symbol": "CM_HORIZONTAL_COLBEAM_JOINT_SECTION",
                "label": "Kolon-Kiriş Birleşim Bölgesi Kesiti",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212258335",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-40572-212258495",
                "commandId": 40572,
                "symbol": "CM_RETAINING_WALL_DRAWINGS",
                "label": "İstinat Duvarı Açılımları",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-64495-212258996",
                "commandId": 64495,
                "symbol": "CM_WELL_FOUNDATION_DRAWINGS",
                "label": "Kuyu Temel Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-62791-212259488",
                "commandId": 62791,
                "symbol": "CM_STAIR_DRAWINGS",
                "label": "Merdiven Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-14088-212259968",
                "commandId": 14088,
                "symbol": "CM_PILE_DRAWINGS",
                "label": "Kazık Temel Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-112-212260451",
                "commandId": 112,
                "symbol": "CM_DOME_DRAWINGS",
                "label": "Kubbe Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-40880-212260976",
            "commandId": 40880,
            "symbol": "CM_CREATE_STEEL_DRAWING_GENERAL_CONSTRUCTION_WITH_PARTS",
            "label": "Çelik",
            "large": true,
            "children": [
              {
                "id": "r25955-40755-212261475",
                "commandId": 40755,
                "symbol": "CM_CREATE_STEEL_DRAWINGS",
                "label": "Çelik Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-846-212261996",
                "commandId": 846,
                "symbol": "CM_CREATE_POINT_DETAIL_GROUP_AUTO",
                "label": "Nokta Detayı Seçimi",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-1258-212262530",
                "commandId": 1258,
                "symbol": "CM_POINT_DETAILS_LIST",
                "label": "Nokta Detayı Listesi",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212263053",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-40870-212263213",
                "commandId": 40870,
                "symbol": "CM_CREATE_STEEL_DRAWING_SINGLE_PART",
                "label": "Tekil Eleman Çizimi",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40871-212263712",
                "commandId": 40871,
                "symbol": "CM_CREATE_STEEL_DRAWING_ASSEMBLY",
                "label": "Montaj Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40872-212264205",
                "commandId": 40872,
                "symbol": "CM_CREATE_STEEL_DRAWING_ASSEMBLY_WITH_SINGLE",
                "label": "Tekil Elemanlarla Montaj Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40873-212264728",
                "commandId": 40873,
                "symbol": "CM_CREATE_STEEL_DRAWING_COLUMN_ANCHORAGE",
                "label": "Kolon Ankraj Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40874-212265235",
                "commandId": 40874,
                "symbol": "CM_CREATE_STEEL_DRAWING_PLAN",
                "label": "Aplikasyon Planı Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40875-212265735",
                "commandId": 40875,
                "symbol": "CM_CREATE_STEEL_DRAWING_AXIS",
                "label": "Aks ve Cephe Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40876-212266230",
                "commandId": 40876,
                "symbol": "CM_CREATE_STEEL_DRAWING_ROOF_PLAN",
                "label": "Çatı Plan Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40877-212266729",
                "commandId": 40877,
                "symbol": "CM_CREATE_STEEL_DRAWING_TRUSS",
                "label": "Makas Çizimi",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40878-212267215",
                "commandId": 40878,
                "symbol": "CM_CREATE_STEEL_DRAWING_3D",
                "label": "3B İzometrik Görünüş Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40879-212267721",
                "commandId": 40879,
                "symbol": "CM_CREATE_STEEL_DRAWING_GENERAL_CONSTRUCTION",
                "label": "Genel Konstrüksiyon Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40880-212268240",
                "commandId": 40880,
                "symbol": "CM_CREATE_STEEL_DRAWING_GENERAL_CONSTRUCTION_WITH_PARTS",
                "label": "Genel Konstrüksiyon Çizimleri - Tekil Eleman ve Montajlar Dahil",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212268804",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-495-212268964",
                "commandId": 495,
                "symbol": "CM_CREATE_SCAFFOLDING_DRAWINGS",
                "label": "İskele Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Çelik-panel-7",
        "label": "Analiz ve Tasarım Görüntüleme",
        "commands": [
          {
            "id": "r25955-12194-212269846",
            "commandId": 12194,
            "symbol": "CM_CHANGE_GL_VIEW_DETAIL_SOLID_WITH_EDGES",
            "label": "Katı Model",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-11820-212270518",
            "commandId": 11820,
            "symbol": "CM_VISUALIZATION_STRUCTURE",
            "label": "Analiz Modeli",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212271177",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": true,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-11832-212271373",
            "commandId": 11832,
            "symbol": "CM_VISUALIZATION_LOAD_WALL",
            "label": "Duvar",
            "large": true,
            "children": [
              {
                "id": "r25955-11847-212272030",
                "commandId": 11847,
                "symbol": "CM_VISUALIZATION_LOAD_OWN",
                "label": "Zati Yükler",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11848-212272751",
                "commandId": 11848,
                "symbol": "CM_VISUALIZATION_LOAD_SLAB_G",
                "label": "Döşeme Yükleri (G)",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11849-212273484",
                "commandId": 11849,
                "symbol": "CM_VISUALIZATION_LOAD_SLAB_Q",
                "label": "Döşeme Yükleri (Q)",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11831-212274217",
                "commandId": 11831,
                "symbol": "CM_VISUALIZATION_LOAD_USER",
                "label": "Kullanıcı Tanımlı Yükler",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212274956",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-11833-212275172",
                "commandId": 11833,
                "symbol": "CM_VISUALIZATION_LOAD_LIVE",
                "label": "Hareketli Yükler",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11834-212275899",
                "commandId": 11834,
                "symbol": "CM_VISUALIZATION_LOAD_WIND",
                "label": "Rüzgar Yükleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11835-212276625",
                "commandId": 11835,
                "symbol": "CM_VISUALIZATION_LOAD_SNOW",
                "label": "Kar Yükleri",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212277398",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": true,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-11836-212277594",
            "commandId": 11836,
            "symbol": "CM_VISUALIZATION_DEFORMATION_MODAL",
            "label": "Modal",
            "large": true,
            "children": [
              {
                "id": "r25955-11837-212278259",
                "commandId": 11837,
                "symbol": "CM_VISUALIZATION_DEFORMATION_14G_16Q",
                "label": "1.4G+1.6Q",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-11840-212279039",
            "commandId": 11840,
            "symbol": "CM_VISUALIZATION_FRAME_MOMENT_3_3",
            "label": "Moment 3-3",
            "large": true,
            "children": [
              {
                "id": "r25955-11838-212279708",
                "commandId": 11838,
                "symbol": "CM_VISUALIZATION_FRAME_AXIAL_FORCE",
                "label": "Eksenel Kuvvet",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11839-212280440",
                "commandId": 11839,
                "symbol": "CM_VISUALIZATION_FRAME_SHEAR_2_2",
                "label": "Kesme kuvveti 2-2",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Çelik-panel-8",
        "label": "Analiz",
        "commands": [
          {
            "id": "r25955-11760-212281538",
            "commandId": 11760,
            "symbol": "CM_COMPLETE_ANALYSIS",
            "label": "Analiz Tasarım",
            "large": true,
            "children": [
              {
                "id": "r25955-11800-212282011",
                "commandId": 11800,
                "symbol": "CM_SLAB_ANALYSIS",
                "label": "Döşeme Analizi",
                "large": false,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-2565-212282524",
                "commandId": 2565,
                "symbol": "CM_STAIR_ANALYSIS",
                "label": "Merdiven Analizi",
                "large": false,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40594-212283037",
                "commandId": 40594,
                "symbol": "CM_POOL_ANALYSIS",
                "label": "Havuz Analizi",
                "large": false,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-2587-212283547",
                "commandId": 2587,
                "symbol": "CM_DOMEVAULT_ANALYSIS",
                "label": "Kubbe ve Tonoz Analizi",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212284090",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-40570-212284250",
                "commandId": 40570,
                "symbol": "CM_RETWALL_ANALYSIS",
                "label": "İstinat Duvarı Analizi",
                "large": false,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-64486-212284774",
                "commandId": 64486,
                "symbol": "CM_WELLFOUND_ANALYSIS",
                "label": "Kuyu Temel Analizi",
                "large": false,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212285298",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-15171-212285458",
                "commandId": 15171,
                "symbol": "CM_PUSHOVER_ANALYSIS",
                "label": "Nonlineer İtme Analizi",
                "large": false,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40556-212285982",
                "commandId": 40556,
                "symbol": "CM_LINEAR_PERFORMANCE_ANALYSIS",
                "label": "Doğrusal Performans Analizi",
                "large": false,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40557-212286521",
                "commandId": 40557,
                "symbol": "CM_RISKY_STRUCTURE_ANALYSIS",
                "label": "Riskli Bina Analizi",
                "large": false,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212287048",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": true,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-13701-212287263",
                "commandId": 13701,
                "symbol": "CM_MODIFY_FINITE_ELEMENT_MESH_SIZES",
                "label": "Sonlu Eleman Genişliklerini Değiştir",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212287819",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": true,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-11880-212288034",
                "commandId": 11880,
                "symbol": "CM_AUTO_SYSTEM_GENERATION",
                "label": "Otomatik Analiz Sistemi Oluşturulması",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11890-212288578",
                "commandId": 11890,
                "symbol": "CM_GENERATE_ANALYSIS_SYSTEM",
                "label": "Analiz Sistemi Oluştur",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212289108",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": true,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-11711-212289323",
                "commandId": 11711,
                "symbol": "CM_GROUND_MOTION_SCALING_IN_TIME_DOMAIN",
                "label": "Yer Hareketi Ölçekleme",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-28141-212289889",
                "commandId": 28141,
                "symbol": "CM_GROUND_MOTION_RECORDS_FOR_MODE_SUPERPOSITION",
                "label": "Deprem Yer Hareketi Kayıtları",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          }
        ]
      }
    ]
  },
  {
    "id": "Birleşim",
    "label": "Birleşim",
    "panels": [
      {
        "id": "r25955-Birleşim-panel-0",
        "label": "Birleşim",
        "commands": [
          {
            "id": "r25955-40767-212291321",
            "commandId": 40767,
            "symbol": "CM_CREATE_SINGLE_PLATE",
            "label": "Tek Kayma Levhalı Birleşim",
            "large": true,
            "children": [
              {
                "id": "r25955-40855-212291809",
                "commandId": 40855,
                "symbol": "CM_CREATE_SINGLE_ANGLE",
                "label": "Tek Köşebentli Birleşim",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40742-212292360",
                "commandId": 40742,
                "symbol": "CM_CREATE_DOUBLE_ANGLE",
                "label": "Çift Köşebentli Birleşim",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40773-212292890",
                "commandId": 40773,
                "symbol": "CM_CREATE_UNSTIFFENED_SEATED_PLATE",
                "label": "Mesnet Köşebentli Birleşim",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40775-212293433",
                "commandId": 40775,
                "symbol": "CM_CREATE_END_PLATE_SHEAR",
                "label": "Alın Levhalı Kayma Birleşimi",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40772-212293969",
                "commandId": 40772,
                "symbol": "CM_CREATE_T_PLATE",
                "label": "T Levhalı Kayma Birleşimi",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212294573",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-40757-212294717",
            "commandId": 40757,
            "symbol": "CM_CREATE_4_BOLTS_UNSTIFFENED_END_PLATE",
            "label": "Rijitleştirilmemiş Alın Levhalı 4 Bulonlu Birleşim",
            "large": true,
            "children": [
              {
                "id": "r25955-40839-212295249",
                "commandId": 40839,
                "symbol": "CM_CREATE_4_BOLTS_STIFFENED_END_PLATE",
                "label": "Rijitleştirilmiş Alın Levhalı 4 Bulonlu Birleşim",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40758-212295886",
                "commandId": 40758,
                "symbol": "CM_CREATE_8_BOLTS_STIFFENED_END_PLATE",
                "label": "Rijitleştirilmiş Alın Levhalı 8 Bulonlu Birleşim",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-40759-212296572",
            "commandId": 40759,
            "symbol": "CM_CREATE_BOLTED_FLANGE_PLATE",
            "label": "Başlık Levhalı Bulonlu Birleşim",
            "large": true,
            "children": [
              {
                "id": "r25955-40760-212297074",
                "commandId": 40760,
                "symbol": "CM_CREATE_WELDED_WEB_CONNECTION",
                "label": "Tam Penetrasyon Kaynaklı Birleşim",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40761-212297624",
                "commandId": 40761,
                "symbol": "CM_CREATE_WELDED_FLANGE_PLATE_CONNECTION",
                "label": "Başlık Levhalı Kaynaklı Birleşim",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212298232",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-40741-212298376",
            "commandId": 40741,
            "symbol": "CM_CREATE_JOINING_PLATES",
            "label": "Alın Levhalı Kiriş Eki",
            "large": true,
            "children": [
              {
                "id": "r25955-40746-212298863",
                "commandId": 40746,
                "symbol": "CM_CREATE_SPLICE",
                "label": "Bindirme Levhalı Kolon/ Kiriş Eki",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212299445",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-40766-212299589",
            "commandId": 40766,
            "symbol": "CM_CREATE_BRACE_CORNER_CONNECTION",
            "label": "Çapraz Uç Birleşimi",
            "large": true,
            "children": [
              {
                "id": "r25955-40765-212300082",
                "commandId": 40765,
                "symbol": "CM_CREATE_BRACE_CENTER_CONNECTION",
                "label": "Çapraz Ek Birleşimi",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212300667",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-40743-212300811",
            "commandId": 40743,
            "symbol": "CM_CREATE_STIFFENED_BASE_PLATE",
            "label": "Kolon -Temel Birleşimi (Mafsallı/ Ankastre Kolon Ayağı)",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212301393",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          }
        ]
      },
      {
        "id": "r25955-Birleşim-panel-1",
        "label": "Konstrüktif Birleşimler",
        "commands": [
          {
            "id": "r25955-40771-212301899",
            "commandId": 40771,
            "symbol": "CM_CREATE_STIFFENED_SHEAR_PLATE",
            "label": "Rijitleştirilmiş Kayma Levhalı Birleşim",
            "large": true,
            "children": [
              {
                "id": "r25955-40754-212302379",
                "commandId": 40754,
                "symbol": "CM_CREATE_FLANGE_PLATE",
                "label": "Başlık Levhalı Birleşim",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40768-212302872",
                "commandId": 40768,
                "symbol": "CM_CREATE_STIFFENED_END_PLATE",
                "label": "Rijitleştirilmiş Alın Levhalı Birleşim",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40778-212303458",
                "commandId": 40778,
                "symbol": "CM_CREATE_STAY_CONNECTION",
                "label": "Köşebentli Kayma Birleşimi",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40803-212303956",
                "commandId": 40803,
                "symbol": "CM_CREATE_STAY_CONNECTION_2",
                "label": "Köşebentli Kayma Birleşimi (Tali Kirişler İçin)",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-40740-212304531",
            "commandId": 40740,
            "symbol": "CM_CREATE_HAUNCH",
            "label": "Guse Birleşimi",
            "large": true,
            "children": [
              {
                "id": "r25955-40762-212305000",
                "commandId": 40762,
                "symbol": "CM_CREATE_EAVES_HAUNCH_CONNECTION",
                "label": "Alın Guse Birleşimi",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40784-212305534",
                "commandId": 40784,
                "symbol": "CM_CREATE_APEX_TYPE_CONNECTION",
                "label": "Mahya Birleşimi",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-40806-212306075",
            "commandId": 40806,
            "symbol": "CM_CREATE_COLUMN_SPLICE",
            "label": "Alın Levhalı Kolon Ekleri",
            "large": true,
            "children": [
              {
                "id": "r25955-65490-212306531",
                "commandId": 65490,
                "symbol": "CM_CREATE_BUILT_UP_COLUMN",
                "label": "Kolon-Kolon Birleşimi (Yapma Kolon)",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-40860-212307087",
            "commandId": 40860,
            "symbol": "CM_CREATE_COLUMN_STIFFENED_END_PLATE",
            "label": "Kolon-Kiriş Rijitleştirilmiş Alın Levhası",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40764-212307569",
            "commandId": 40764,
            "symbol": "CM_CREATE_SEATING_SUPPORT_CONNECTION",
            "label": "Mesnet Bölgesi Birleşimi",
            "large": true,
            "children": [
              {
                "id": "r25955-41000-212308069",
                "commandId": 41000,
                "symbol": "CM_CREATE_END_PLATE_TRUSS",
                "label": "Alın Levhalı Makas Birleşimi",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-42000-212308569",
                "commandId": 42000,
                "symbol": "CM_CREATE_END_PLATE_FOR_BOX_TUBE_TRUSS",
                "label": "Kutu ve Boru Profiller İçin Alın Levhalı Makas Birleşimi",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40787-212309112",
                "commandId": 40787,
                "symbol": "CM_CREATE_SEATING_TRUSS_CONNECTION",
                "label": "Makas Mesnet Birleşimi",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40752-212309613",
                "commandId": 40752,
                "symbol": "CM_CREATE_TRUSS_CONNECTION",
                "label": "Makas Birleşimi",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-63767-212310251",
            "commandId": 63767,
            "symbol": "CM_CREATE_WELDED_CONNECTION",
            "label": "Kaynaklı Birleşim",
            "large": true,
            "children": [
              {
                "id": "r25955-40783-212310703",
                "commandId": 40783,
                "symbol": "CM_CREATE_DOUBLE_PLATE_SEATING_CONNECTION",
                "label": "Çift Levhalı Çerçeve Köşesi Birleşimi",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40763-212311232",
                "commandId": 40763,
                "symbol": "CM_CREATE_WELDED_BOX_TUBE_CONNECTION",
                "label": "Kutu/ Boru Profiller için Kaynaklı Birleşim",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40781-212311758",
                "commandId": 40781,
                "symbol": "CM_CREATE_SEATING_WELD_CONNECTION",
                "label": "Kaynaklı Çerçeve Köşesi ve Mahya Birleşimi",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40785-212312283",
                "commandId": 40785,
                "symbol": "CM_CREATE_BOX_TUBE_SEATING_CONNECTION",
                "label": "Kutu/ Boru Profiller için Çerçeve Köşesi Birleşimi",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40782-212312820",
                "commandId": 40782,
                "symbol": "CM_CREATE_SINGLE_PLATE_SEATING_CONNECTION",
                "label": "Tek Levhalı Çerçeve Köşesi Birleşimi",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-40780-212313398",
            "commandId": 40780,
            "symbol": "CM_CREATE_BOX_TUBE_SPLICE_CONNECTION",
            "label": "Kutu/ Boru Profiller için Bindirme Levhalı Ek",
            "large": true,
            "children": [
              {
                "id": "r25955-40779-212313887",
                "commandId": 40779,
                "symbol": "CM_CREATE_BOX_TUBE_END_PLATE_CONNECTION",
                "label": "Boru/Kutu Profiller için Alın Levhalı Birleşim",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-40769-212314471",
            "commandId": 40769,
            "symbol": "CM_CREATE_STIFFENER_PLATE",
            "label": "Rijitleştirme Levhaları ( Berkitmeler)",
            "large": true,
            "children": [
              {
                "id": "r25955-40881-212314942",
                "commandId": 40881,
                "symbol": "CM_CREATE_HORIZONTAL_STIFFENER_PLATE",
                "label": "Çoklu Yatay Rijitleştirme Levhaları ( Berkitmeler)",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40776-212315477",
                "commandId": 40776,
                "symbol": "CM_CREATE_SPACER_PLATE",
                "label": "Ara Levhası",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40850-212315955",
                "commandId": 40850,
                "symbol": "CM_CREATE_CAP_PLATE",
                "label": "Kutu/Boru Tepe Levhası",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12271-212316441",
                "commandId": 12271,
                "symbol": "CM_CREATE_QUAD_STIFFENER",
                "label": "Dörtlü Berkitme levhası",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-40770-212316986",
            "commandId": 40770,
            "symbol": "CM_CREATE_STUB",
            "label": "Konsol Elemanı",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40749-212317415",
            "commandId": 40749,
            "symbol": "CM_CREATE_PURLIN_CONNECTION",
            "label": "Aşık Birleşimi",
            "large": true,
            "children": [
              {
                "id": "r25955-40789-212317897",
                "commandId": 40789,
                "symbol": "CM_CREATE_GIRT_CONNECTION",
                "label": "Kuşak Birleşimi",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-40777-212318436",
            "commandId": 40777,
            "symbol": "CM_CREATE_WIND_CONNECTION",
            "label": "Rüzgar Birleşimi",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40840-212318879",
            "commandId": 40840,
            "symbol": "CM_CREATE_CRANE_CONNECTION",
            "label": "Kren Birleşimi",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40805-212319320",
            "commandId": 40805,
            "symbol": "CM_CREATE_CONTINUOUS_BEAM",
            "label": "Sürekli Kiriş Birleşimi",
            "large": true,
            "children": [
              {
                "id": "r25955-40774-212319777",
                "commandId": 40774,
                "symbol": "CM_CREATE_NOTCHED_SEATING",
                "label": "Kertme Kiriş Birleşimi",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-40972-212320321",
            "commandId": 40972,
            "symbol": "CM_CREATE_SIMPLE_BASE_PLATE",
            "label": "Kolon Ayağı",
            "large": true,
            "children": [
              {
                "id": "r25955-40970-212320767",
                "commandId": 40970,
                "symbol": "CM_CREATE_RIGID_ON_BOTH_AXIS_BASE_PLATE",
                "label": "Her İki Eksende Rijit Kolon Ayağı",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40971-212321286",
                "commandId": 40971,
                "symbol": "CM_CREATE_RIGID_ON_STRONG_AXIS_BASE_PLATE",
                "label": "Kuvvetli Eksende Rijit Kolon Ayağı",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40974-212321807",
                "commandId": 40974,
                "symbol": "CM_CREATE_ROUND_PLATE_TUBE_BASE_PLATE",
                "label": "Dairesel Levhalı Boru Profiller İçin Kolon Ayağı",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40973-212322341",
                "commandId": 40973,
                "symbol": "CM_CREATE_TUBE_BASE_PLATE",
                "label": "Dikdörtgen Levhalı Boru Profiller İçin Kolon Ayağı",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Birleşim-panel-2",
        "label": "Mod",
        "commands": [
          {
            "id": "r25955-6103-212323257",
            "commandId": 6103,
            "symbol": "CM_CONNECTION_FAST_DRAWING",
            "label": "Hızlı Çizim Modu",
            "large": true,
            "children": [],
            "type": "Button"
          }
        ]
      }
    ]
  },
  {
    "id": "Objeler",
    "label": "Objeler",
    "panels": [
      {
        "id": "r25955-Objeler-panel-0",
        "label": "Objeler",
        "commands": [
          {
            "id": "r25955-40578-212324579",
            "commandId": 40578,
            "symbol": "CM_DRAW_POOL",
            "label": "Havuz",
            "large": true,
            "children": [
              {
                "id": "r25955-62693-212325034",
                "commandId": 62693,
                "symbol": "CM_POOL_SETTINGS",
                "label": "Havuz Ayarları",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-12990-212325596",
            "commandId": 12990,
            "symbol": "CM_DRAW_LIBRARY",
            "label": "Kütüphane",
            "large": true,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Objeler-panel-1",
        "label": "Çatı",
        "commands": [
          {
            "id": "r25955-14050-212326395",
            "commandId": 14050,
            "symbol": "CM_DRAW_ROOF",
            "label": "Çatı",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40051-212326845",
            "commandId": 40051,
            "symbol": "CM_DRAW_ROOF_HOLE",
            "label": "Çatı Boşluğu",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-14070-212327310",
            "commandId": 14070,
            "symbol": "CM_DRAW_ROOF_PLANE",
            "label": "Çatı Yüzeyi",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212327774",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-40031-212327918",
            "commandId": 40031,
            "symbol": "CM_DRAW_DOME",
            "label": "Kubbe",
            "large": true,
            "children": [
              {
                "id": "r25955-40045-212328373",
                "commandId": 40045,
                "symbol": "CM_DRAW_ARC_DOME",
                "label": "Yay Kubbe",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40137-212328878",
                "commandId": 40137,
                "symbol": "CM_DRAW_ARC_DOME_3P",
                "label": "3 Noktadan Yay Kubbe",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212329397",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-40037-212329557",
                "commandId": 40037,
                "symbol": "CM_SETTINGS_DOME",
                "label": "Kubbe Ayarları",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-40046-212330119",
            "commandId": 40046,
            "symbol": "CM_DRAW_VAULT",
            "label": "Tonoz",
            "large": true,
            "children": [
              {
                "id": "r25955-40064-212330575",
                "commandId": 40064,
                "symbol": "CM_DRAW_BORDER_VAULT",
                "label": "Sınır Tonoz",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212331088",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-40060-212331248",
                "commandId": 40060,
                "symbol": "CM_SETTINGS_VAULT",
                "label": "Tonoz Ayarları",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212331811",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-40055-212331955",
            "commandId": 40055,
            "symbol": "CM_DRAW_RAFTER",
            "label": "Mertek",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40057-212332407",
            "commandId": 40057,
            "symbol": "CM_DRAW_PURLIN",
            "label": "Aşık",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40553-212332859",
            "commandId": 40553,
            "symbol": "CM_DRAW_FASCIA_BOARD",
            "label": "Saçak pervazı",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40056-212333326",
            "commandId": 40056,
            "symbol": "CM_DRAW_LATH",
            "label": "Lata",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40058-212333774",
            "commandId": 40058,
            "symbol": "CM_DRAW_HV_RAFTER",
            "label": "Mahya",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40059-212334228",
            "commandId": 40059,
            "symbol": "CM_DRAW_POST",
            "label": "Dikme",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40061-212334677",
            "commandId": 40061,
            "symbol": "CM_DRAW_STRUT",
            "label": "Göğüsleme",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40066-212335134",
            "commandId": 40066,
            "symbol": "CM_DRAW_COLLAR",
            "label": "Çift Gergi",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40069-212335591",
            "commandId": 40069,
            "symbol": "CM_DRAW_TRIMMER",
            "label": "Kasnak Kirişi",
            "large": false,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Objeler-panel-2",
        "label": "Arazi",
        "commands": [
          {
            "id": "r25955-40580-212336394",
            "commandId": 40580,
            "symbol": "CM_DRAW_TERRAIN",
            "label": "Arazi Poligonu",
            "large": true,
            "children": [
              {
                "id": "r25955-13722-212336861",
                "commandId": 13722,
                "symbol": "CM_TERRAIN_SETTINGS",
                "label": "Arazi Ayarları",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-40581-212337426",
            "commandId": 40581,
            "symbol": "CM_DRAW_TERRAIN_PLATEAU",
            "label": "Plato",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40585-212337886",
            "commandId": 40585,
            "symbol": "CM_DRAW_TERRAIN_HOLE",
            "label": "Boşluk",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40586-212338345",
            "commandId": 40586,
            "symbol": "CM_DRAW_TERRAIN_SUB_REGION",
            "label": "Alt Bölge",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40582-212338813",
            "commandId": 40582,
            "symbol": "CM_DRAW_TERRAIN_ELEVATION_POINT",
            "label": "Kot Noktası",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40583-212339288",
            "commandId": 40583,
            "symbol": "CM_DRAW_TERRAIN_ELEVATION_LINE",
            "label": "Kot Çizgisi",
            "large": false,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Objeler-panel-3",
        "label": "Donatı",
        "commands": [
          {
            "id": "r25955-14363-212340106",
            "commandId": 14363,
            "symbol": "CM_DRAW_STIRRUP",
            "label": "Çiroz",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-14364-212340559",
            "commandId": 14364,
            "symbol": "CM_DRAW_ETRIYE",
            "label": "Etriye",
            "large": true,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Objeler-panel-4",
        "label": "Kesit",
        "commands": [
          {
            "id": "r25955-13330-212341324",
            "commandId": 13330,
            "symbol": "CM_GET_SECTION",
            "label": "Kesit Hattı",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-11610-212341787",
            "commandId": 11610,
            "symbol": "CM_VIEW_SECTION",
            "label": "Kesit / Görünüş Listesi",
            "large": true,
            "children": [],
            "type": "Button"
          }
        ]
      }
    ]
  },
  {
    "id": "Değiştir",
    "label": "Değiştir",
    "panels": [
      {
        "id": "r25955-Değiştir-panel-0",
        "label": "Obje Özellikleri",
        "commands": [
          {
            "id": "r25955-13470-212343072",
            "commandId": 13470,
            "symbol": "CM_OBJECT_EDIT",
            "label": "Obje Özellikleri",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-13070-212343535",
            "commandId": 13070,
            "symbol": "CM_GET_SETTINGS_FROM_ENTITY",
            "label": "Objeden Ayarları Al",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40131-212344012",
            "commandId": 40131,
            "symbol": "CM_SET_SETTINGS_DEFAULT",
            "label": "Objeye Ayarları Ver",
            "large": true,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Değiştir-panel-1",
        "label": "Obje Edit",
        "commands": [
          {
            "id": "r25955-12673-212344833",
            "commandId": 12673,
            "symbol": "CM_MOVE_AXIS_LABEL",
            "label": "Aks Etiketini Taşı",
            "large": true,
            "children": [
              {
                "id": "r25955-12650-212345310",
                "commandId": 12650,
                "symbol": "CM_SETTINGS_AXIS_BORDER",
                "label": "Aks Sınırı",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-13980-212345824",
                "commandId": 13980,
                "symbol": "CM_CALCULATE_CONTOUR",
                "label": "Kontur Hesapla",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-11313-212346389",
            "commandId": 11313,
            "symbol": "CM_RIBBON_MENU_MODIFY_COLUMN",
            "label": "Kolon",
            "large": true,
            "children": [
              {
                "id": "r25955-12020-212346858",
                "commandId": 12020,
                "symbol": "CM_SHORT_COLUMN_EDIT",
                "label": "Kısa Kolonlar",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11640-212347372",
                "commandId": 11640,
                "symbol": "CM_SET_COLUMN_LENGTHS",
                "label": "Kolon Boyutları",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-14260-212347887",
                "commandId": 14260,
                "symbol": "CM_TRIM_COLUMN",
                "label": "Kolon Trimle",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-2602-212348393",
                "commandId": 2602,
                "symbol": "CM_CHANGE_JACKET_EDGE",
                "label": "Manto Kenarını Değiştir",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-2603-212348920",
                "commandId": 2603,
                "symbol": "CM_RESET_JACKET_EDGE",
                "label": "Manto Kenarını Kaldır",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-65099-212349443",
                "commandId": 65099,
                "symbol": "CM_DEFINE_ISOLATOR",
                "label": "İzolatör Tanımla",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-11314-212350011",
            "commandId": 11314,
            "symbol": "CM_RIBBON_MENU_MODIFY_BEAM",
            "label": "Kiriş/Temel",
            "large": true,
            "children": [
              {
                "id": "r25955-14220-212350485",
                "commandId": 14220,
                "symbol": "CM_CONSOLE_EDIT",
                "label": "Konsollar",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-13930-212350989",
                "commandId": 13930,
                "symbol": "CM_SET_BEAM_FOUNDATION_DIRECTION",
                "label": "Obje Yönü Belirle",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-11315-212351571",
            "commandId": 11315,
            "symbol": "CM_RIBBON_MENU_MODIFY_DIMENSION",
            "label": "Ölçülendirme",
            "large": true,
            "children": [
              {
                "id": "r25955-715-212352053",
                "commandId": 715,
                "symbol": "CM_DIM_ADD_PARENT",
                "label": "Ölçülendirmeye Parça Ekle/Çıkar",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-722-212352585",
                "commandId": 722,
                "symbol": "CM_DIM_MOVE_TEXT",
                "label": "Ölçülendirme Yazılarını Taşı",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-724-212353115",
                "commandId": 724,
                "symbol": "CM_DIM_SHOW_HIDE_TEXT",
                "label": "Ölçülendirme Yazısını Göster/Kapat",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-728-212353655",
                "commandId": 728,
                "symbol": "CM_DIM_RESET_TEXT_DATA",
                "label": "Ölçülendirme Yazılarını İlk Haline Getir",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212354202",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-759-212354362",
                "commandId": 759,
                "symbol": "CM_EDIT_LABEL_TEXT",
                "label": "Etiket Yazısı Değiştir",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-11316-212354935",
            "commandId": 11316,
            "symbol": "CM_RIBBON_MENU_MODIFY_SLAB",
            "label": "Döşeme",
            "large": true,
            "children": [
              {
                "id": "r25955-14030-212355405",
                "commandId": 14030,
                "symbol": "CM_MOVE_SLAB_TEXT",
                "label": "Döşeme Yazısı Taşı",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-14200-212355926",
                "commandId": 14200,
                "symbol": "CM_SCL_EDIT",
                "label": "Betonarme Hesap Aksı Edit",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-14202-212356443",
                "commandId": 14202,
                "symbol": "CM_SCL_CHANGE_GEOMETRY",
                "label": "Donatı Hesap Aksı Geometrisi Değiştir",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-14210-212356986",
                "commandId": 14210,
                "symbol": "CM_SCL_DELETE",
                "label": "Betonarme Hesap Aksı Sil",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40010-212357509",
                "commandId": 40010,
                "symbol": "CM_SET_TYPICAL_NERV_BEAM",
                "label": "Tipik Diş Belirle",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212358031",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-13580-212358191",
                "commandId": 13580,
                "symbol": "CM_TRANSFORM_SLAB_TO_NERVUR",
                "label": "Nervüre Dönüştür",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-13590-212358719",
                "commandId": 13590,
                "symbol": "CM_TRANSFORM_SLAB_TO_CASETTE",
                "label": "Kasete Dönüştür",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-11317-212359301",
            "commandId": 11317,
            "symbol": "CM_RIBBON_MENU_MODIFY_STAIR",
            "label": "Merdiven",
            "large": true,
            "children": [
              {
                "id": "r25955-13850-212359774",
                "commandId": 13850,
                "symbol": "CM_EDIT_STAIR_PARAMETERS",
                "label": "Merdiven Edit",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-2562-212360291",
                "commandId": 2562,
                "symbol": "CM_SET_STAIR_BOUNDARY_CONDITIONS",
                "label": "Merdiven Mesnetlenme Koşullarını Belirle",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-13880-212360845",
                "commandId": 13880,
                "symbol": "CM_STAIR_DEFORMATION",
                "label": "Merdiven Deformasyonu",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-13900-212361366",
                "commandId": 13900,
                "symbol": "CM_CANCEL_STAIR_DEFORMATION",
                "label": "Merdiven Deformasyonunu İptal Et",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-13910-212361906",
                "commandId": 13910,
                "symbol": "CM_SECONDARY_STAIR_DEFORMATION",
                "label": "İkincil Merdiven Deformasyonu",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-13920-212362446",
                "commandId": 13920,
                "symbol": "CM_CANCEL_SECONDARY_STAIR_DEFORMATION",
                "label": "İkincil Merdiven Deformasyonunu İptal Et",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-602-212363005",
                "commandId": 602,
                "symbol": "CM_MOVE_STAIR_TEXT",
                "label": "Merdiven Yazısını Taşı",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-13860-212363530",
                "commandId": 13860,
                "symbol": "CM_SHOW_HIDE_STAIR_RAILING",
                "label": "Korkuluk Sakla/Göster",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-13870-212364058",
                "commandId": 13870,
                "symbol": "CM_EDIT_STAIR_BALUSTER_COUNT",
                "label": "Korkuluk Sayısı Değiştir",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-13890-212364594",
                "commandId": 13890,
                "symbol": "CM_SAVE_STAIR",
                "label": "Merdiven Kaydet",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-11318-212365153",
            "commandId": 11318,
            "symbol": "CM_RIBBON_MENU_MODIFY_POOL",
            "label": "Havuz",
            "large": true,
            "children": [
              {
                "id": "r25955-40584-212365622",
                "commandId": 40584,
                "symbol": "CM_SET_POOL_SURFACE_SLOPE",
                "label": "Havuz Yüzey Eğimini Ayarla",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40592-212366155",
                "commandId": 40592,
                "symbol": "CM_SET_POOL_SURFACE_PROPERTIES",
                "label": "Havuz Yüzeyi Özellikleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40590-212366691",
                "commandId": 40590,
                "symbol": "CM_SET_POOL_WALL_PROPERTIES",
                "label": "Havuz Duvar Özelliklerini Ayarla",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40591-212367235",
                "commandId": 40591,
                "symbol": "CM_SET_POOL_CANTILEVER_SLAB_PROPERTIES",
                "label": "Havuz Konsol Döşeme Özelliklerini Ayarla",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-12480-212367847",
            "commandId": 12480,
            "symbol": "CM_CHANGE_TEXT",
            "label": "Yazı Değiştir",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40220-212368307",
            "commandId": 40220,
            "symbol": "CM_SET_HATCH_REFERENCE",
            "label": "Tarama Referans Noktası Tanımla",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212368794",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-13740-212368938",
            "commandId": 13740,
            "symbol": "CM_ORDER_OBJECT_NAME",
            "label": "Obje Adlandır",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40559-212369404",
            "commandId": 40559,
            "symbol": "CM_AUTO_ORDER_OBJECT_NAME",
            "label": "Objeleri Otomatik Adlandır",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12630-212369888",
            "commandId": 12630,
            "symbol": "CM_OBJECT_TRIM_STATUS",
            "label": "Obje Trim Yöntemi",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-14191-212370357",
            "commandId": 14191,
            "symbol": "CM_INCLINE_OBJECTS",
            "label": "Eğimli Objeler",
            "large": true,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Değiştir-panel-2",
        "label": "Katmanlar",
        "commands": [
          {
            "id": "r25955-1064-212371168",
            "commandId": 1064,
            "symbol": "CM_LAYER_SHOW_HIDE",
            "label": "Katmanları Göster/Sakla",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-772-212371642",
            "commandId": 772,
            "symbol": "CM_LAYER_LOCK_UNLOCK",
            "label": "Katmanları Kilitle/Çöz",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-14290-212372117",
            "commandId": 14290,
            "symbol": "CM_SET_ENTITY_LAYER",
            "label": "Obje Katmanı Değiştir",
            "large": false,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Değiştir-panel-3",
        "label": "Yük Ekle",
        "commands": [
          {
            "id": "r25955-65000-212372909",
            "commandId": 65000,
            "symbol": "CM_ADD_POINT_LOAD",
            "label": "Noktasal Yük",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-65001-212373371",
            "commandId": 65001,
            "symbol": "CM_ADD_UNIFORM_LOAD",
            "label": "Düzgün Yayılı Yük",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-65002-212373844",
            "commandId": 65002,
            "symbol": "CM_ADD_TRAPEZOIDAL_LOAD",
            "label": "Trapez Yük",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-65023-212374310",
            "commandId": 65023,
            "symbol": "CM_ADD_PANEL_VERTICAL_LOAD",
            "label": "Perde Düşey Yükü",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-65025-212374788",
            "commandId": 65025,
            "symbol": "CM_ADD_PANEL_LATERAL_LOAD",
            "label": "Perde Yatay Yükü",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-217-212375263",
            "commandId": 217,
            "symbol": "CM_ADD_UNIFORM_AREA_LOAD",
            "label": "Düzgün Alan Yükü",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-64139-212375736",
            "commandId": 64139,
            "symbol": "CM_ADD_STRUCTURAL_WALL_SOIL_LOAD_WITH_HYDROSTATIC_PRESSURE",
            "label": "Perde Toprak Yükü",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-64140-212376244",
            "commandId": 64140,
            "symbol": "CM_ADD_STRUCTURAL_WALL_HYDROSTATIC_LOAD",
            "label": "Perde Su Yükü",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-65010-212376729",
            "commandId": 65010,
            "symbol": "CM_EDIT_LOADS",
            "label": "Eleman Yükü Değiştir",
            "large": true,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Değiştir-panel-4",
        "label": "Dönüştür",
        "commands": [
          {
            "id": "r25955-64133-212377515",
            "commandId": 64133,
            "symbol": "CM_CONVERT_TO_SHEARWALL",
            "label": "Kirişi Perdeye",
            "large": true,
            "children": [
              {
                "id": "r25955-64134-212377991",
                "commandId": 64134,
                "symbol": "CM_CONVERT_TO_BEAM",
                "label": "Perdeyi Kirişe",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212378504",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-436-212378664",
                "commandId": 436,
                "symbol": "CM_CONVERT_COLUMN_TO_SHEARWALL",
                "label": "Kolonu Perdeye",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-442-212379188",
                "commandId": 442,
                "symbol": "CM_CONVERT_SHEARWALL_TO_COLUMN",
                "label": "Perdeyi Kolona",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212379712",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-1278-212379872",
                "commandId": 1278,
                "symbol": "CM_TRANSFORM_COLUMNS_CIRCULAR_TO_RECTANGULAR",
                "label": "Daire Kolonu Dikdörtgen Kolona",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-494-212380428",
                "commandId": 494,
                "symbol": "CM_TRANSFORM_COLUMNS_RECTANGULAR_TO_CIRCULAR",
                "label": "Dikdörtgen Kolonu Daire Kolona",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212380983",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-11500-212381199",
                "commandId": 11500,
                "symbol": "CM_TRANSFORM_ENTITIES_TO_BEAM",
                "label": "Eğrisel Objeyi Kirişe",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11510-212381729",
                "commandId": 11510,
                "symbol": "CM_TRANSFORM_ENTITIES_TO_PANEL",
                "label": "Eğrisel Objeyi Perdeye",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212382260",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-11620-212382420",
                "commandId": 11620,
                "symbol": "CM_TRANSFORM_TO_POLYGON_COLUMN",
                "label": "Kapalı Poligonu Poligon Kolona",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-62483-212383024",
                "commandId": 62483,
                "symbol": "CM_TRANSFORM_TO_POLYGON_SECTION",
                "label": "Kapalı Poligonu Poligon Kesite",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-65350-212383566",
                "commandId": 65350,
                "symbol": "CM_TRANSFORM_TO_PLATE_SECTION",
                "label": "Poligonu Levha Kesitine",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          }
        ]
      }
    ]
  },
  {
    "id": "Araçlar",
    "label": "Araçlar",
    "panels": [
      {
        "id": "r25955-Araçlar-panel-0",
        "label": "Düzenle",
        "commands": [
          {
            "id": "r25955-13600-212384951",
            "commandId": 13600,
            "symbol": "CM_UNDO",
            "label": "Geri Al",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-13610-212385408",
            "commandId": 13610,
            "symbol": "CM_REDO",
            "label": "İleri Al",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-11540-212385865",
            "commandId": 11540,
            "symbol": "CM_LOCAL_UNDO",
            "label": "Lokal Undo",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12500-212386327",
            "commandId": 12500,
            "symbol": "CM_FAST_COPY",
            "label": "Kat Kopyala",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212386780",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-12510-212386924",
            "commandId": 12510,
            "symbol": "CM_COPY_CONTOUR",
            "label": "Kontur Kopyala",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12520-212387384",
            "commandId": 12520,
            "symbol": "CM_PASTE_CONTOUR",
            "label": "Kontur Yapıştır",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212387849",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-11235-212387993",
            "commandId": 11235,
            "symbol": "CM_MAKE_ARCHITECTURAL_FILE_COMPATIBLE_WITH_STRUCTURAL",
            "label": "Statik İle Uyumlu Yap",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-11234-212388504",
            "commandId": 11234,
            "symbol": "CM_MAKE_STRUCTURAL_FILE_COMPATIBLE_WITH_ARCHITECTURAL",
            "label": "Mimari İle Uyumlu Yap",
            "large": true,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Araçlar-panel-1",
        "label": "Araçlar",
        "commands": [
          {
            "id": "r25955-65123-212389331",
            "commandId": 65123,
            "symbol": "CM_ROTATE_PROJECT",
            "label": "Yapıyı Döndür",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-13680-212389814",
            "commandId": 13680,
            "symbol": "CM_GEOMETRY_CHECK",
            "label": "Geometri Kontrolü",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40559-212390281",
            "commandId": 40559,
            "symbol": "CM_AUTO_ORDER_OBJECT_NAME",
            "label": "Objeleri Otomatik Adlandır",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212390765",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-14340-212390909",
            "commandId": 14340,
            "symbol": "CM_TOGGLE_SKETCH_MODE",
            "label": "Eskiz Modu",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212391372",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-13800-212391516",
            "commandId": 13800,
            "symbol": "CM_FIND_ENTITY",
            "label": "Bul  Değiştir",
            "large": true,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Araçlar-panel-2",
        "label": "Referans",
        "commands": [
          {
            "id": "r25955-13660-212392307",
            "commandId": 13660,
            "symbol": "CM_DISTANCE",
            "label": "Uzaklık",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-13650-212392758",
            "commandId": 13650,
            "symbol": "CM_AREA",
            "label": "Alan",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40221-212393201",
            "commandId": 40221,
            "symbol": "CM_ANGLE",
            "label": "Açı",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-2618-212393646",
            "commandId": 2618,
            "symbol": "CM_AS_CALCULATOR",
            "label": "Donatı Alanı Hesabı",
            "large": false,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Araçlar-panel-3",
        "label": "Metraj",
        "commands": [
          {
            "id": "r25955-735-212394458",
            "commandId": 735,
            "symbol": "CM_DESIGN_COMPONENTS",
            "label": "Yapı Bileşenlerini Tasarla",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40550-212394936",
            "commandId": 40550,
            "symbol": "CM_COMPONENTS_REPORT",
            "label": "Yapı Bileşenleri Metrajı",
            "large": true,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Araçlar-panel-4",
        "label": "Oluştur",
        "commands": [
          {
            "id": "r25955-11590-212395731",
            "commandId": 11590,
            "symbol": "CM_EXPLODE_GRAPHWINDOW",
            "label": "2B Çizim Oluştur",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-11610-212396201",
            "commandId": 11610,
            "symbol": "CM_VIEW_SECTION",
            "label": "Kesit / Görünüş Listesi",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-63313-212396673",
            "commandId": 63313,
            "symbol": "CM_GENERATE_VECTOR_DRAWING",
            "label": "Vektör Çizim Oluştur",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40143-212397154",
            "commandId": 40143,
            "symbol": "CM_RENDER",
            "label": "Render",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212397601",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-14630-212397745",
            "commandId": 14630,
            "symbol": "CM_ENTITY_FROM_PRIMITIVE",
            "label": "2B Mimari Proje Oku",
            "large": true,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Araçlar-panel-5",
        "label": "Seçim Grupları",
        "commands": [
          {
            "id": "r25955-40129-212398573",
            "commandId": 40129,
            "symbol": "CM_GET_SELECTION",
            "label": "Seçimi Kaydet",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40130-212399035",
            "commandId": 40130,
            "symbol": "CM_SET_SELECTION",
            "label": "Seçimi Hatırla",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40017-212399499",
            "commandId": 40017,
            "symbol": "CM_SELECTION_GROUPS",
            "label": "Grup Listesi",
            "large": true,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Araçlar-panel-6",
        "label": "Import / Export",
        "commands": [
          {
            "id": "r25955-11323-212400313",
            "commandId": 11323,
            "symbol": "CM_RIBBON_MENU_IMPORTS_DUMMY",
            "label": "Import",
            "large": true,
            "children": [
              {
                "id": "r25955-9904-212400802",
                "commandId": 9904,
                "symbol": "CM_IMPORT_DWG",
                "label": "DWG/DXF-2B",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-9905-212401304",
                "commandId": 9905,
                "symbol": "CM_IMPORT_DWG_AS_STRUCTURE",
                "label": "DWG/DXF (Yapı olarak)",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-28080-212401832",
                "commandId": 28080,
                "symbol": "CM_IMPORT_IFC",
                "label": "IFC",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-11324-212402402",
            "commandId": 11324,
            "symbol": "CM_RIBBON_MENU_EXPORTS_DUMMY",
            "label": "Export",
            "large": true,
            "children": [
              {
                "id": "r25955-11920-212402891",
                "commandId": 11920,
                "symbol": "CM_SAP2000_OUTPUT",
                "label": "SAP2000",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11922-212403395",
                "commandId": 11922,
                "symbol": "CM_EXPORT_TO_CSICOL",
                "label": "CSICOL",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11336-212403900",
                "commandId": 11336,
                "symbol": "CM_EXPORT_TO_PDF",
                "label": "PDF",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-9901-212404399",
                "commandId": 9901,
                "symbol": "CM_EXPORT_DWG",
                "label": "DWG/DXF/DWF",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-9902-212404902",
                "commandId": 9902,
                "symbol": "CM_EXPORT_FAST_DWG",
                "label": "DWG/DXF/DWF tek",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40229-212405414",
                "commandId": 40229,
                "symbol": "CM_SAVE_SCREEN_IMAGE",
                "label": "Ekran Görüntüsü Kaydet",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-28077-212405940",
                "commandId": 28077,
                "symbol": "CM_EXPORT_DUMP",
                "label": "Tekla",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11382-212406439",
                "commandId": 11382,
                "symbol": "CM_EXPORT_OBJ",
                "label": "3D Yazıcı (.OBJ)",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-28078-212406954",
                "commandId": 28078,
                "symbol": "CM_EXPORT_IFC",
                "label": "IFC",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11921-212407473",
                "commandId": 11921,
                "symbol": "CM_EXPORT_EXCEL",
                "label": "Excel .xml",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Araçlar-panel-7",
        "label": "Dosya Paylaşımı",
        "commands": [
          {
            "id": "r25955-12530-212408383",
            "commandId": 12530,
            "symbol": "CM_EDIT_COPY_TO_FILE",
            "label": "Dosyaya Kopyala",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12550-212408848",
            "commandId": 12550,
            "symbol": "CM_EDIT_PASTE_FROM_FILE",
            "label": "Dosyadan Yapıştır",
            "large": true,
            "children": [],
            "type": "Button"
          }
        ]
      }
    ]
  },
  {
    "id": "Ayarlar",
    "label": "Ayarlar",
    "panels": [
      {
        "id": "r25955-Ayarlar-panel-0",
        "label": "Proje Ayarları",
        "commands": [
          {
            "id": "r25955-11240-212410129",
            "commandId": 11240,
            "symbol": "CM_STORY_SETTINGS",
            "label": "Kat",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-15163-212410579",
            "commandId": 15163,
            "symbol": "CM_PROJECT_SETTINGS",
            "label": "Proje",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212411037",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          }
        ]
      },
      {
        "id": "r25955-Ayarlar-panel-1",
        "label": "Ayarlar",
        "commands": [
          {
            "id": "r25955-12600-212411496",
            "commandId": 12600,
            "symbol": "CM_PREFERENCES",
            "label": "Genel Ayarlar",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212411953",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-11470-212412097",
            "commandId": 11470,
            "symbol": "CM_LOAD_SETTINGS",
            "label": "Ayarları Yükle",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-11480-212412560",
            "commandId": 11480,
            "symbol": "CM_SAVE_SETTINGS",
            "label": "Ayarları Kaydet",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-13410-212413023",
            "commandId": 13410,
            "symbol": "CM_RESET_SETTINGS",
            "label": "Ayarları İlk Haline Getir",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212413499",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-13130-212413643",
            "commandId": 13130,
            "symbol": "CM_SETTINGS_LAYER",
            "label": "Katman",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-13570-212414096",
            "commandId": 13570,
            "symbol": "CM_PEN_THICKNESS_SETTINGS",
            "label": "Kalem ve Renk Ayarları",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-13575-212414576",
            "commandId": 13575,
            "symbol": "CM_ALIAS_EDITOR",
            "label": "Komut Satırı Editörü",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40144-212415066",
            "commandId": 40144,
            "symbol": "CM_TRANSPARENT_STORY_SETTINGS",
            "label": "Objelerin Katlardaki Görünürlüğü",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40073-212415565",
            "commandId": 40073,
            "symbol": "CM_MATERIALS",
            "label": "Materyaller",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-63223-212416020",
            "commandId": 63223,
            "symbol": "CM_LOAD_LIBRARY",
            "label": "Yük Kütüphanesi",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-63226-212416485",
            "commandId": 63226,
            "symbol": "CM_FRP_LIBRARY",
            "label": "Lifli Polimer Güçlendirme Kütüphanesi",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-14690-212416989",
            "commandId": 14690,
            "symbol": "CM_SOIL_LAYERS",
            "label": "Zemin Katmanları",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-65086-212417452",
            "commandId": 65086,
            "symbol": "CM_SEISMIC_ISOLATORS",
            "label": "Deprem İzolatörleri",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-13701-212417925",
            "commandId": 13701,
            "symbol": "CM_MODIFY_FINITE_ELEMENT_MESH_SIZES",
            "label": "Sonlu Eleman Genişliklerini Değiştir",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-18106-212418433",
            "commandId": 18106,
            "symbol": "CM_VIEW_SETTINGS_RIBBON",
            "label": "Görüntü",
            "large": true,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Ayarlar-panel-2",
        "label": "Birimler",
        "commands": [
          {
            "id": "r25955-25080-212419231",
            "commandId": 25080,
            "symbol": "TID_SET_UNITS_LENGTH",
            "label": "Uzunluk:",
            "large": true,
            "children": [],
            "type": "Button"
          }
        ]
      }
    ]
  },
  {
    "id": "Görüntü",
    "label": "Görüntü",
    "panels": [
      {
        "id": "r25955-Görüntü-panel-0",
        "label": "Perspektif",
        "commands": [
          {
            "id": "r25955-12098-212420522",
            "commandId": 12098,
            "symbol": "CM_CHANGE_GL_VIEW_TO_PERSPECTIVE_RIBBON",
            "label": "Perspektif",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12092-212421020",
            "commandId": 12092,
            "symbol": "CM_CHANGE_GL_VIEW_TO_TOP_RIBBON",
            "label": "Üst",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12093-212421504",
            "commandId": 12093,
            "symbol": "CM_CHANGE_GL_VIEW_TO_BOTTOM_RIBBON",
            "label": "Alt",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12096-212421990",
            "commandId": 12096,
            "symbol": "CM_CHANGE_GL_VIEW_TO_LEFT_RIBBON",
            "label": "Sol",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12097-212422474",
            "commandId": 12097,
            "symbol": "CM_CHANGE_GL_VIEW_TO_RIGHT_RIBBON",
            "label": "Sağ",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12094-212422960",
            "commandId": 12094,
            "symbol": "CM_CHANGE_GL_VIEW_TO_FRONT_RIBBON",
            "label": "Ön",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12095-212423445",
            "commandId": 12095,
            "symbol": "CM_CHANGE_GL_VIEW_TO_BACK_RIBBON",
            "label": "Arka",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12195-212423930",
            "commandId": 12195,
            "symbol": "CM_CHANGE_GL_VIEW_TO_AXONOMETRIC_RIBBON",
            "label": "Aksonometrik",
            "large": true,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Görüntü-panel-1",
        "label": "Çalışma Düzlemi",
        "commands": [
          {
            "id": "r25955-40451-212424757",
            "commandId": 40451,
            "symbol": "CM_DRAW_TARGET_WORKPLANE",
            "label": "Hedef Çalışma Düzlemi",
            "large": true,
            "children": [
              {
                "id": "r25955-62798-212425261",
                "commandId": 62798,
                "symbol": "CM_DRAW_HORIZONTAL_WORKPLANE",
                "label": "Yatay Çalışma Düzlemi",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-62797-212425815",
                "commandId": 62797,
                "symbol": "CM_DRAW_VERTICAL_WORKPLANE",
                "label": "Dikey Çalışma Düzlemi",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-62799-212426367",
                "commandId": 62799,
                "symbol": "CM_DRAW_3P_WORKPLANE",
                "label": "3 Noktadan Çalışma Düzlem",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-40283-212426968",
            "commandId": 40283,
            "symbol": "CM_CREATE_CLIP_PLANE",
            "label": "Kesme Düzlemi Oluştur",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-18099-212427460",
            "commandId": 18099,
            "symbol": "CM_DISPLAY_VERTICAL_FRAME",
            "label": "Düşey Çerçeve Olarak Göster",
            "large": true,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Görüntü-panel-2",
        "label": "Görüntü",
        "commands": [
          {
            "id": "r25955-12194-212428284",
            "commandId": 12194,
            "symbol": "CM_CHANGE_GL_VIEW_DETAIL_SOLID_WITH_EDGES",
            "label": "Kenar Çizgili Katı Model",
            "large": true,
            "children": [
              {
                "id": "r25955-12191-212428806",
                "commandId": 12191,
                "symbol": "CM_CHANGE_GL_VIEW_DETAIL_HIDDEN_LINE",
                "label": "Saklı Çizgi",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12193-212429356",
                "commandId": 12193,
                "symbol": "CM_CHANGE_GL_VIEW_DETAIL_SOLID",
                "label": "Katı Model",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-12192-212429949",
            "commandId": 12192,
            "symbol": "CM_CHANGE_GL_VIEW_DETAIL_HIDDEN_LINE_BW",
            "label": "Siyah Beyaz Saklı Çizgi",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40143-212430462",
            "commandId": 40143,
            "symbol": "CM_RENDER",
            "label": "Render",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-11820-212430909",
            "commandId": 11820,
            "symbol": "CM_VISUALIZATION_STRUCTURE",
            "label": "Analiz Modeli",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212431397",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-13583-212431541",
            "commandId": 13583,
            "symbol": "CM_GRID_AND_LIMITS_SETTINGS",
            "label": "Izgara ve Sınırlar",
            "large": true,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Görüntü-panel-3",
        "label": "Pencere",
        "commands": [
          {
            "id": "r25955-14310-212432305",
            "commandId": 14310,
            "symbol": "CM_ACTIVATE_NEXT_WINDOW",
            "label": "Sonraki Pencere",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-14320-212432775",
            "commandId": 14320,
            "symbol": "CM_ACTIVATE_PREVIOUS_WINDOW",
            "label": "Önceki Pencere",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212433249",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-15700-212433393",
            "commandId": 15700,
            "symbol": "CM_RIBBON_MENU_WINDOW_LIST_STORIES",
            "label": "Kat listesi",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-15701-212433838",
            "commandId": 15701,
            "symbol": "CM_RIBBON_MENU_WINDOW_LIST_DRAWINGS",
            "label": "Çizim Listesi",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212434287",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-11150-212434431",
            "commandId": 11150,
            "symbol": "CM_PROJECT_WINDOWS",
            "label": "Çizimler",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212434890",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-18076-212435034",
            "commandId": 18076,
            "symbol": "CM_PANE_FULLSCREEN",
            "label": "Tam Ekran",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40075-212435498",
            "commandId": 40075,
            "symbol": "CM_CONFIGURE_VIEWPORT",
            "label": "Görüntü Konfigürasyonu",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212435977",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-12606-212436174",
            "commandId": 12606,
            "symbol": "CM_SHOW_STRUCTURE_TREE",
            "label": "Yapı Ağacını Göster",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12605-212436671",
            "commandId": 12605,
            "symbol": "CM_SHOW_COORDINATE_BOX",
            "label": "Koordinat Kutusunu Göster",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12607-212437170",
            "commandId": 12607,
            "symbol": "CM_SHOW_TOOLBARS",
            "label": "Toolbarları Göster",
            "large": true,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Görüntü-panel-4",
        "label": "Zoom",
        "commands": [
          {
            "id": "r25955-40152-212437969",
            "commandId": 40152,
            "symbol": "CM_REALTIME_ZOOM",
            "label": "Zoom",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-14360-212438421",
            "commandId": 14360,
            "symbol": "CM_ZOOM_SELECTION",
            "label": "Zoom Seçim",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-13020-212438881",
            "commandId": 13020,
            "symbol": "CM_ZOOM_RECTANGLE",
            "label": "Zoom Pencere",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-13030-212439351",
            "commandId": 13030,
            "symbol": "CM_ZOOM_EXTENTS",
            "label": "Zoom Çizim",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-13080-212439815",
            "commandId": 13080,
            "symbol": "CM_PAN",
            "label": "Kaydır",
            "large": false,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Görüntü-panel-5",
        "label": "Mod",
        "commands": [
          {
            "id": "r25955-11380-212440581",
            "commandId": 11380,
            "symbol": "CM_STATIC_MODE",
            "label": "Mimari Plan/Kalıp Planı",
            "large": false,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Görüntü-panel-6",
        "label": "Görüntü",
        "commands": [
          {
            "id": "r25955-11370-212441369",
            "commandId": 11370,
            "symbol": "CM_SHOW_NODES",
            "label": "D.N. Çiz",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-11371-212441831",
            "commandId": 11371,
            "symbol": "CM_DRAW_LINE_WEIGHTS",
            "label": "Çizgi Kalınlıklarını Göster",
            "large": false,
            "children": [],
            "type": "Button"
          }
        ]
      }
    ]
  },
  {
    "id": "Analiz ve Tasarım",
    "label": "Analiz ve Tasarım",
    "panels": [
      {
        "id": "r25955-Analiz ve Tasarım-panel-0",
        "label": "Analiz Modeli",
        "commands": [
          {
            "id": "r25955-11710-212443136",
            "commandId": 11710,
            "symbol": "CM_ANALYSIS_SETTINGS",
            "label": "Analiz Ayarları",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-11730-212443604",
            "commandId": 11730,
            "symbol": "CM_STORY_PARAMETERS",
            "label": "Kat Parametreleri",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-2729-212444072",
            "commandId": 2729,
            "symbol": "CM_ADD_NEW_MATERIAL",
            "label": "Yeni Malzeme",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40350-212444551",
            "commandId": 40350,
            "symbol": "CM_CHECK_SEMI_RIGID",
            "label": "Yarı Rijit",
            "large": false,
            "children": [],
            "type": "Button_Check"
          }
        ]
      },
      {
        "id": "r25955-Analiz ve Tasarım-panel-1",
        "label": "Betonarme Tasarım",
        "commands": [
          {
            "id": "r25955-12420-212445419",
            "commandId": 12420,
            "symbol": "CM_SLAB_CONCRETE_DIALOG",
            "label": "Döşeme",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12440-212445939",
            "commandId": 12440,
            "symbol": "CM_NERVUR_CONCRETE_DIALOG",
            "label": "Nervür",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12450-212446403",
            "commandId": 12450,
            "symbol": "CM_CASETTE_CONCRETE_DIALOG",
            "label": "Kaset",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12421-212446927",
            "commandId": 12421,
            "symbol": "CM_SLAB_WITH_MW_CONCRETE_DIALOG",
            "label": "Hasır Donatılı Döşeme",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212447417",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": true,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-12370-212447613",
            "commandId": 12370,
            "symbol": "CM_BEAM_CONCRETE_DIALOG",
            "label": "Kiriş",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212448074",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": true,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-12390-212448270",
            "commandId": 12390,
            "symbol": "CM_COLUMN_CONCRETE_DIALOG",
            "label": "Kolon",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12411-212448789",
            "commandId": 12411,
            "symbol": "CM_COLUMN_SUPPORT_CONCRETE_DIALOG",
            "label": "Kolon/Perde Zımbalama",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212449276",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": true,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-12460-212449472",
            "commandId": 12460,
            "symbol": "CM_PANEL_CONCRETE_DIALOG",
            "label": "Perde",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12391-212449990",
            "commandId": 12391,
            "symbol": "CM_SHEARWALL_CORE_GROUP_CONCRETE_DIALOG",
            "label": "Perde Grubu",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212450489",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": true,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-12430-212450685",
            "commandId": 12430,
            "symbol": "CM_FOUND_SLAB_CONCRETE_DIALOG",
            "label": "Radye Temel",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12400-212451157",
            "commandId": 12400,
            "symbol": "CM_FOUND_CONCRETE_DIALOG",
            "label": "Sürekli Temel",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12410-212451684",
            "commandId": 12410,
            "symbol": "CM_SFOUND_CONCRETE_DIALOG",
            "label": "Tekil Temel",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12380-212452209",
            "commandId": 12380,
            "symbol": "CM_CONBEAM_CONCRETE_DIALOG",
            "label": "Temel Bağ Kirişi",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212452685",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": true,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-62790-212452881",
            "commandId": 62790,
            "symbol": "CM_STAIR_CONCRETE_DIALOG",
            "label": "Merdiven",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-65096-212453313",
            "commandId": 65096,
            "symbol": "CM_PILE_CONCRETE_DIALOG",
            "label": "Kazık",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-168-212453742",
            "commandId": 168,
            "symbol": "CM_DOME_CONCRETE_DIALOG",
            "label": "Kubbe",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212454168",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-63384-212454312",
            "commandId": 63384,
            "symbol": "CM_RETWALL_CONCRETE_DIALOG",
            "label": "İstinat Duvarı",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-64492-212454811",
            "commandId": 64492,
            "symbol": "CM_WELLFOUND_CONCRETE_DIALOG",
            "label": "Kuyu Temel",
            "large": false,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Analiz ve Tasarım-panel-2",
        "label": "Çelik Tasarım",
        "commands": [
          {
            "id": "r25955-174-212455572",
            "commandId": 174,
            "symbol": "CM_STEEL_COLUMN_DESIGN_DIALOG",
            "label": "Kolon",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-28013-212456036",
            "commandId": 28013,
            "symbol": "CM_STEEL_BEAM_DESIGN_DIALOG",
            "label": "Kiriş",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-28015-212456501",
            "commandId": 28015,
            "symbol": "CM_SECONDARY_STEEL_BEAM_DESIGN_DIALOG",
            "label": "Tali Kiriş",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-28052-212456981",
            "commandId": 28052,
            "symbol": "CM_COMPOSITE_BEAM_DESIGN_DIALOG",
            "label": "Kompozit",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-28051-212457509",
            "commandId": 28051,
            "symbol": "CM_CASTELLATED_BEAM_DESIGN_DIALOG",
            "label": "Kompozit Olmayan Petek Kiriş",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-28111-212458020",
            "commandId": 28111,
            "symbol": "CM_COMPOSITE_CASTELLATED_BEAM_DESIGN_DIALOG",
            "label": "Kompozit Petek Kiriş",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-28054-212458534",
            "commandId": 28054,
            "symbol": "CM_CRANE_BEAM_DESIGN_DIALOG",
            "label": "Kren Kirişi",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-28043-212459005",
            "commandId": 28043,
            "symbol": "CM_STEEL_PURLIN_DESIGN_DIALOG",
            "label": "Aşık",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-28019-212459472",
            "commandId": 28019,
            "symbol": "CM_STEEL_BRACE_DESIGN_DIALOG",
            "label": "Çapraz",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-28021-212459939",
            "commandId": 28021,
            "symbol": "CM_STEEL_TRUSS_DESIGN_DIALOG",
            "label": "Makas",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-28056-212460404",
            "commandId": 28056,
            "symbol": "CM_SPACE_TRUSS_DESIGN_DIALOG",
            "label": "Uzay Kafes",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-28006-212460874",
            "commandId": 28006,
            "symbol": "CM_STEEL_JOIST_DESIGN_DIALOG",
            "label": "R Aşık",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-28007-212461344",
            "commandId": 28007,
            "symbol": "CM_SPACE_PURLIN_DESIGN_DIALOG",
            "label": "Uzay Aşık",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-28023-212461818",
            "commandId": 28023,
            "symbol": "CM_STEEL_CONNECTION_DESIGN_DIALOG",
            "label": "Birleşim",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212462292",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": true,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-28136-212462487",
            "commandId": 28136,
            "symbol": "CM_SELECT_MRF_MEMBERS",
            "label": "Moment Aktaran",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-28137-212463029",
            "commandId": 28137,
            "symbol": "CM_SELECT_CBF_MEMBERS",
            "label": "Merkezi Çaprazlı",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212463518",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-28005-212463662",
            "commandId": 28005,
            "symbol": "CM_PERFORM_CLASH_CHECK",
            "label": "Çakışma Kontrolü",
            "large": true,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Analiz ve Tasarım-panel-3",
        "label": "Donatı",
        "commands": [
          {
            "id": "r25955-11720-212464480",
            "commandId": 11720,
            "symbol": "CM_USABLE_STEEL_SETTINGS",
            "label": "Donatı Seçimi",
            "large": true,
            "children": [
              {
                "id": "r25955-11721-212464957",
                "commandId": 11721,
                "symbol": "CM_MESH_WIRE_SETTINGS",
                "label": "Hasır Donatı Ayarları",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Analiz ve Tasarım-panel-4",
        "label": "Tasarım Parametreleri",
        "commands": [
          {
            "id": "r25955-12301-212465892",
            "commandId": 12301,
            "symbol": "CM_GENERAL_CONCRETE_SETTINGS",
            "label": "Betonarme",
            "large": true,
            "children": [
              {
                "id": "r25955-12301-212466367",
                "commandId": 12301,
                "symbol": "CM_GENERAL_CONCRETE_SETTINGS",
                "label": "Genel Betonarme Parametreleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12280-212466904",
                "commandId": 12280,
                "symbol": "CM_COLUMN_CONCRETE_SETTINGS",
                "label": "Kolon Parametreleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12300-212467430",
                "commandId": 12300,
                "symbol": "CM_BEAM_CONCRETE_SETTINGS",
                "label": "Kiriş Parametreleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12290-212467955",
                "commandId": 12290,
                "symbol": "CM_PANEL_CONCRETE_SETTINGS",
                "label": "Perde Parametreleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12320-212468480",
                "commandId": 12320,
                "symbol": "CM_SLAB_CONCRETE_SETTINGS",
                "label": "Döşeme Parametreleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12360-212469007",
                "commandId": 12360,
                "symbol": "CM_NERVUR_CONCRETE_SETTINGS",
                "label": "Nervür-Kaset Parametreleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12340-212469541",
                "commandId": 12340,
                "symbol": "CM_SINGULAR_FOUNDATION_CONCRETE_SETTINGS",
                "label": "Tekil Temel Parametreleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12350-212470086",
                "commandId": 12350,
                "symbol": "CM_FOUNDATION_CONCRETE_SETTINGS",
                "label": "Sürekli Temel Parametreleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12330-212470625",
                "commandId": 12330,
                "symbol": "CM_FOUNDATION_SLAB_CONCRETE_SETTINGS",
                "label": "Radye Parametreleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-2569-212471164",
                "commandId": 2569,
                "symbol": "CM_STAIR_CONCRETE_SETTINGS",
                "label": "Merdiven Parametreleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-2590-212471691",
                "commandId": 2590,
                "symbol": "CM_DOMEVAULT_CONCRETE_SETTINGS",
                "label": "Kubbe ve Tonoz Parametreleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40565-212472228",
                "commandId": 40565,
                "symbol": "CM_RETWALL_CONCRETE_SETTINGS",
                "label": "İstinat Duvarı Parametreleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-64526-212472766",
                "commandId": 64526,
                "symbol": "CM_WELLFOUND_CONCRETE_SETTINGS",
                "label": "Kuyu Temel Parametreleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-14779-212473264",
                "commandId": 14779,
                "symbol": "CM_PILE_CONCRETE_SETTINGS",
                "label": "Kazık Parametreleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12310-212473789",
                "commandId": 12310,
                "symbol": "CM_FOUNDATION_TIE_CONCRETE_SETTINGS",
                "label": "Temel Bağ Kirişi Parametreleri",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-14449-212474387",
            "commandId": 14449,
            "symbol": "CM_WELD_ELECTRODES",
            "label": "Kaynak Elektrotları",
            "large": true,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Analiz ve Tasarım-panel-5",
        "label": "Tanımla",
        "commands": [
          {
            "id": "r25955-62230-212475177",
            "commandId": 62230,
            "symbol": "CM_ADD_NEW_SECTION",
            "label": "Kesit",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-2725-212475649",
            "commandId": 2725,
            "symbol": "CM_ADD_NEW_COMBINATION",
            "label": "Kombinasyon",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-11309-212476130",
            "commandId": 11309,
            "symbol": "CM_RIBBON_MENU_LOAD_CASE_DUMMY",
            "label": "Yükleme",
            "large": false,
            "children": [
              {
                "id": "r25955-2724-212476623",
                "commandId": 2724,
                "symbol": "CM_ADD_NEW_LOAD_CASE",
                "label": "Doğrusal Statik Analiz Durumu",
                "large": false,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-1743-212477174",
                "commandId": 1743,
                "symbol": "CM_ADD_NEW_NONLINEAR_ANALYSIS_CASE",
                "label": "Doğrusal Olmayan Analiz",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-10221-212477733",
                "commandId": 10221,
                "symbol": "CM_ADD_NEW_MODAL_ANALYSIS_CASE",
                "label": "Modal Analiz",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212478276",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-1723-212478492",
                "commandId": 1723,
                "symbol": "CM_ADD_NEW_RESPONSE_SPECTRUM_FUNCTION",
                "label": "Tasarım Spektrumu",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-1730-212479047",
                "commandId": 1730,
                "symbol": "CM_ADD_NEW_RESPONSE_SPECTRUM_CASE",
                "label": "Tasarım Spektrum Durumu",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-1746-212479604",
                "commandId": 1746,
                "symbol": "CM_ADD_NEW_EULER_BUCKLING_CASE",
                "label": "Euler Burkulma Durumu",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212480155",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-1747-212480371",
                "commandId": 1747,
                "symbol": "CM_ADD_NEW_TIME_HISTORY_FUNCTION",
                "label": "Zaman Tanım Alanı Fonksiyonu",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-1776-212480933",
                "commandId": 1776,
                "symbol": "CM_ADD_NEW_TIME_HISTORY_CASE",
                "label": "Zaman Tanım Alanı Durumu",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Analiz ve Tasarım-panel-6",
        "label": "Analiz",
        "commands": [
          {
            "id": "r25955-11760-212481852",
            "commandId": 11760,
            "symbol": "CM_COMPLETE_ANALYSIS",
            "label": "Analiz Tasarım",
            "large": true,
            "children": [
              {
                "id": "r25955-11800-212482325",
                "commandId": 11800,
                "symbol": "CM_SLAB_ANALYSIS",
                "label": "Döşeme Analizi",
                "large": false,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-2565-212482838",
                "commandId": 2565,
                "symbol": "CM_STAIR_ANALYSIS",
                "label": "Merdiven Analizi",
                "large": false,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40594-212483351",
                "commandId": 40594,
                "symbol": "CM_POOL_ANALYSIS",
                "label": "Havuz Analizi",
                "large": false,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-2587-212483861",
                "commandId": 2587,
                "symbol": "CM_DOMEVAULT_ANALYSIS",
                "label": "Kubbe ve Tonoz Analizi",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212484404",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-40570-212484564",
                "commandId": 40570,
                "symbol": "CM_RETWALL_ANALYSIS",
                "label": "İstinat Duvarı Analizi",
                "large": false,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-64486-212485088",
                "commandId": 64486,
                "symbol": "CM_WELLFOUND_ANALYSIS",
                "label": "Kuyu Temel Analizi",
                "large": false,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212485612",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-15171-212485772",
                "commandId": 15171,
                "symbol": "CM_PUSHOVER_ANALYSIS",
                "label": "Nonlineer İtme Analizi",
                "large": false,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40556-212486296",
                "commandId": 40556,
                "symbol": "CM_LINEAR_PERFORMANCE_ANALYSIS",
                "label": "Doğrusal Performans Analizi",
                "large": false,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40557-212486835",
                "commandId": 40557,
                "symbol": "CM_RISKY_STRUCTURE_ANALYSIS",
                "label": "Riskli Bina Analizi",
                "large": false,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212487362",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": true,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-13701-212487577",
                "commandId": 13701,
                "symbol": "CM_MODIFY_FINITE_ELEMENT_MESH_SIZES",
                "label": "Sonlu Eleman Genişliklerini Değiştir",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212488133",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": true,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-11880-212488348",
                "commandId": 11880,
                "symbol": "CM_AUTO_SYSTEM_GENERATION",
                "label": "Otomatik Analiz Sistemi Oluşturulması",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11890-212488892",
                "commandId": 11890,
                "symbol": "CM_GENERATE_ANALYSIS_SYSTEM",
                "label": "Analiz Sistemi Oluştur",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212489422",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": true,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-11711-212489637",
                "commandId": 11711,
                "symbol": "CM_GROUND_MOTION_SCALING_IN_TIME_DOMAIN",
                "label": "Yer Hareketi Ölçekleme",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-28141-212490203",
                "commandId": 28141,
                "symbol": "CM_GROUND_MOTION_RECORDS_FOR_MODE_SUPERPOSITION",
                "label": "Deprem Yer Hareketi Kayıtları",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          }
        ]
      }
    ]
  },
  {
    "id": "Analiz ve Tasarım Görüntüleme",
    "label": "Analiz ve Tasarım Görüntüleme",
    "panels": [
      {
        "id": "r25955-Analiz ve Tasarım Görüntüleme-panel-0",
        "label": "Görüntü",
        "commands": [
          {
            "id": "r25955-15700-212491660",
            "commandId": 15700,
            "symbol": "CM_RIBBON_MENU_WINDOW_LIST_STORIES",
            "label": "Kat listesi",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212492105",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-12194-212492302",
            "commandId": 12194,
            "symbol": "CM_CHANGE_GL_VIEW_DETAIL_SOLID_WITH_EDGES",
            "label": "Katı Model",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-11820-212492974",
            "commandId": 11820,
            "symbol": "CM_VISUALIZATION_STRUCTURE",
            "label": "Analiz Modeli",
            "large": true,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Analiz ve Tasarım Görüntüleme-panel-1",
        "label": "Yükler",
        "commands": [
          {
            "id": "r25955-11832-212493948",
            "commandId": 11832,
            "symbol": "CM_VISUALIZATION_LOAD_WALL",
            "label": "Duvar",
            "large": true,
            "children": [
              {
                "id": "r25955-11847-212494605",
                "commandId": 11847,
                "symbol": "CM_VISUALIZATION_LOAD_OWN",
                "label": "Zati Yükler",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11848-212495326",
                "commandId": 11848,
                "symbol": "CM_VISUALIZATION_LOAD_SLAB_G",
                "label": "Döşeme Yükleri (G)",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11849-212496059",
                "commandId": 11849,
                "symbol": "CM_VISUALIZATION_LOAD_SLAB_Q",
                "label": "Döşeme Yükleri (Q)",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11831-212496792",
                "commandId": 11831,
                "symbol": "CM_VISUALIZATION_LOAD_USER",
                "label": "Kullanıcı Tanımlı Yükler",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212497531",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-11833-212497747",
                "commandId": 11833,
                "symbol": "CM_VISUALIZATION_LOAD_LIVE",
                "label": "Hareketli Yükler",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11834-212498474",
                "commandId": 11834,
                "symbol": "CM_VISUALIZATION_LOAD_WIND",
                "label": "Rüzgar Yükleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11835-212499200",
                "commandId": 11835,
                "symbol": "CM_VISUALIZATION_LOAD_SNOW",
                "label": "Kar Yükleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11851-212499922",
                "commandId": 11851,
                "symbol": "CM_VISUALIZATION_LOAD_SOIL",
                "label": "Toprak Yükleri",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Analiz ve Tasarım Görüntüleme-panel-2",
        "label": "Deformasyon",
        "commands": [
          {
            "id": "r25955-11836-212501017",
            "commandId": 11836,
            "symbol": "CM_VISUALIZATION_DEFORMATION_MODAL",
            "label": "Modal",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-11837-212501676",
            "commandId": 11837,
            "symbol": "CM_VISUALIZATION_DEFORMATION_14G_16Q",
            "label": "1.4G+1.6Q",
            "large": true,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Analiz ve Tasarım Görüntüleme-panel-3",
        "label": "Kesit Tesirleri",
        "commands": [
          {
            "id": "r25955-11838-212502664",
            "commandId": 11838,
            "symbol": "CM_VISUALIZATION_FRAME_AXIAL_FORCE",
            "label": "Eksenel Kuvvet",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-11839-212503332",
            "commandId": 11839,
            "symbol": "CM_VISUALIZATION_FRAME_SHEAR_2_2",
            "label": "Kesme kuvveti 2-2",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-11840-212504001",
            "commandId": 11840,
            "symbol": "CM_VISUALIZATION_FRAME_MOMENT_3_3",
            "label": "Moment 3-3",
            "large": true,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Analiz ve Tasarım Görüntüleme-panel-4",
        "label": "Perde",
        "commands": [
          {
            "id": "r25955-11841-212504977",
            "commandId": 11841,
            "symbol": "CM_VISUALIZATION_SHEARWALL_AXIAL_FORCE",
            "label": "Eksenel Kuvvet",
            "large": true,
            "children": [
              {
                "id": "r25955-11842-212505655",
                "commandId": 11842,
                "symbol": "CM_VISUALIZATION_SHEARWALL_SHEAR_2_2",
                "label": "2-2 Perde Kesme Kuvveti",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11843-212506398",
                "commandId": 11843,
                "symbol": "CM_VISUALIZATION_SHEARWALL_SHEAR_3_3",
                "label": "3-3 Perde Kesme Kuvveti",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11844-212507141",
                "commandId": 11844,
                "symbol": "CM_VISUALIZATION_SHEARWALL_MOMENT_2_2",
                "label": "2-2 Perde Momenti",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11845-212507879",
                "commandId": 11845,
                "symbol": "CM_VISUALIZATION_SHEARWALL_MOMENT_3_3",
                "label": "3-3 Perde Momenti",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Analiz ve Tasarım Görüntüleme-panel-5",
        "label": "Aşık",
        "commands": [
          {
            "id": "r25955-11846-212508982",
            "commandId": 11846,
            "symbol": "CM_VISUALIZATION_PURLIN_MOMENT_3_3",
            "label": "Moment 3-3",
            "large": true,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Analiz ve Tasarım Görüntüleme-panel-6",
        "label": "Kabuk Elemanlar",
        "commands": [
          {
            "id": "r25955-12070-212509969",
            "commandId": 12070,
            "symbol": "CM_VISUALIZATION_SHELL_SOLVED_WITH_STRUCTURE",
            "label": "Kabuk Sonuçları",
            "large": true,
            "children": [
              {
                "id": "r25955-12072-212510656",
                "commandId": 12072,
                "symbol": "CM_VISUALIZATION_SHELL_DOME_VAULT",
                "label": "Tonoz ve Kubbe Sonuçları",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12073-212511399",
                "commandId": 12073,
                "symbol": "CM_VISUALIZATION_SHELL_STAIR",
                "label": "Merdiven Sonuçları",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12071-212512131",
                "commandId": 12071,
                "symbol": "CM_VISUALIZATION_SHELL_SLAB",
                "label": "Döşeme Sonuçları",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12201-212512862",
                "commandId": 12201,
                "symbol": "CM_VISUALIZATION_RAFT_FOUNDATION_RESULTS",
                "label": "Radye Sonuçları",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12202-212513603",
                "commandId": 12202,
                "symbol": "CM_VISUALIZATION_POOL_RESULTS",
                "label": "Havuz Sonuçları",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-12130-212514384",
            "commandId": 12130,
            "symbol": "CM_VISUALIZATION_SHELL_SOLVED_WITH_STRUCTURE_AS1VS",
            "label": "As1 Görünen",
            "large": true,
            "children": [
              {
                "id": "r25955-12131-212515073",
                "commandId": 12131,
                "symbol": "CM_VISUALIZATION_SHELL_SOLVED_WITH_STRUCTURE_AS1UP",
                "label": "As1 Üst",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12132-212515815",
                "commandId": 12132,
                "symbol": "CM_VISUALIZATION_SHELL_SOLVED_WITH_STRUCTURE_AS1UN",
                "label": "As1 Alt",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-12133-212516607",
            "commandId": 12133,
            "symbol": "CM_VISUALIZATION_SHELL_SOLVED_WITH_STRUCTURE_AS2VS",
            "label": "As2 Görünen",
            "large": true,
            "children": [
              {
                "id": "r25955-12134-212517296",
                "commandId": 12134,
                "symbol": "CM_VISUALIZATION_SHELL_SOLVED_WITH_STRUCTURE_AS2UP",
                "label": "As2 Üst",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12135-212518038",
                "commandId": 12135,
                "symbol": "CM_VISUALIZATION_SHELL_SOLVED_WITH_STRUCTURE_AS2UN",
                "label": "As2 Alt",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Analiz ve Tasarım Görüntüleme-panel-7",
        "label": "Veri",
        "commands": [
          {
            "id": "r25955-11311-212519142",
            "commandId": 11311,
            "symbol": "CM_RIBBON_MENU_VISUALIZATION_CONCRETE_INPUT",
            "label": "Betonarme",
            "large": true,
            "children": [
              {
                "id": "r25955-15720-212519820",
                "commandId": 15720,
                "symbol": "CM_VISUALIZATION_CONCRETE_DESIGN_IN_ELEMENT_MATERIALS",
                "label": "Eleman Malzemeleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-15723-212520575",
                "commandId": 15723,
                "symbol": "CM_VISUALIZATION_CONCRETE_DESIGN_IN_RIGIDITY_REDUCTIONS",
                "label": "Rijitlik Azaltmaları",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-15724-212521335",
                "commandId": 15724,
                "symbol": "CM_VISUALIZATION_CONCRETE_DESIGN_IN_OVERRIDDEN_ELEMENTS",
                "label": "Kullanıcı Tanımlı Elemanlar",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-15728-212522105",
                "commandId": 15728,
                "symbol": "CM_VISUALIZATION_CONCRETE_DESIGN_IN_SHEARWALL_THICKNESS",
                "label": "Perde Kalınlığı",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-15729-212522863",
                "commandId": 15729,
                "symbol": "CM_VISUALIZATION_CONCRETE_DESIGN_IN_MODULUS_OF_SUBGRADE_REACTION",
                "label": "Yatak Katsayısı",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12075-212523628",
                "commandId": 12075,
                "symbol": "CM_VISUALIZATION_CONCRETE_DESIGN_IN_SLAB_COATING",
                "label": "Döşeme Kaplama Yükleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-15722-212524385",
                "commandId": 15722,
                "symbol": "CM_VISUALIZATION_CONCRETE_DESIGN_IN_ELEMENT_LENGTHS",
                "label": "Eleman Boyları",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-15727-212525135",
                "commandId": 15727,
                "symbol": "CM_VISUALIZATION_CONCRETE_DESIGN_IN_T_BEAM_WIDTHS",
                "label": "Tabla Genişlikleri",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212525938",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-12074-212526083",
            "commandId": 12074,
            "symbol": "CM_VISUALIZATION_CONCRETE_DESIGN_IN_SLAB_THICKNESS",
            "label": "Döşeme Kalınlıkları",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-15725-212526771",
            "commandId": 15725,
            "symbol": "CM_VISUALIZATION_CONCRETE_DESIGN_IN_SLAB_TOTAL_DEAD_LOADS",
            "label": "Döşeme Sabit Yükleri",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12076-212527466",
            "commandId": 12076,
            "symbol": "CM_VISUALIZATION_CONCRETE_DESIGN_IN_SLAB_LIVE",
            "label": "Döşeme Hareketli Yükleri",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12077-212528149",
            "commandId": 12077,
            "symbol": "CM_VISUALIZATION_CONCRETE_DESIGN_IN_WALL_LOADS",
            "label": "Duvar Yükleri",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-15721-212528886",
            "commandId": 15721,
            "symbol": "CM_VISUALIZATION_CONCRETE_DESIGN_IN_ELEMENT_SECTIONS",
            "label": "Eleman Kesitleri",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-15726-212529574",
            "commandId": 15726,
            "symbol": "CM_VISUALIZATION_CONCRETE_DESIGN_IN_BEAM_LIVE_LOADS",
            "label": "Kiriş Hareketli Yükleri",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212530270",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-11312-212530415",
            "commandId": 11312,
            "symbol": "CM_RIBBON_MENU_VISUALIZATION_STEEL_INPUT",
            "label": "Çelik",
            "large": true,
            "children": [
              {
                "id": "r25955-15752-212531087",
                "commandId": 15752,
                "symbol": "CM_VISUALIZATION_STEEL_DESIGN_IN_OVERRIDDEN_ELEMENTS",
                "label": "Kullanıcı tanımlı elemanlar",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-15762-212531854",
                "commandId": 15762,
                "symbol": "CM_VISUALIZATION_STEEL_DESIGN_IN_BEAM_LIVE_LOADS",
                "label": "Kiriş hareketli yükleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-15763-212532611",
                "commandId": 15763,
                "symbol": "CM_VISUALIZATION_STEEL_DESIGN_IN_CONNECTION_PLATE_MATERIALS",
                "label": "Birleşim levhası malzemeleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-15764-212533384",
                "commandId": 15764,
                "symbol": "CM_VISUALIZATION_STEEL_DESIGN_IN_CONNECTION_ELECTRODE_TYPES",
                "label": "Birleşim kaynak elektrotları",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-15750-212534157",
                "commandId": 15750,
                "symbol": "CM_VISUALIZATION_STEEL_DESIGN_IN_ELEMENT_MATERIALS",
                "label": "Eleman malzemeleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-15757-212534909",
                "commandId": 15757,
                "symbol": "CM_VISUALIZATION_STEEL_DESIGN_IN_SLAB_THICKNESS",
                "label": "Döşeme kalınlıkları",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-15758-212535664",
                "commandId": 15758,
                "symbol": "CM_VISUALIZATION_STEEL_DESIGN_IN_SLAB_COATING_LOADS",
                "label": "Döşeme kaplama yükleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-15761-212536424",
                "commandId": 15761,
                "symbol": "CM_VISUALIZATION_STEEL_DESIGN_IN_WALL_LOADS",
                "label": "Duvar yükleri",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-12084-212537216",
            "commandId": 12084,
            "symbol": "CM_VISUALIZATION_STEEL_DESIGN_IN_ELEMENT_SECTIONS",
            "label": "Eleman Kesitleri",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-15759-212537958",
            "commandId": 15759,
            "symbol": "CM_VISUALIZATION_STEEL_DESIGN_IN_SLAB_TOTAL_DEAD_LOADS",
            "label": "Döşeme Sabit Yükleri",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-15760-212538655",
            "commandId": 15760,
            "symbol": "CM_VISUALIZATION_STEEL_DESIGN_IN_SLAB_LIVE_LOADS",
            "label": "Döşeme Hareketli Yükleri",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-15751-212539350",
            "commandId": 15751,
            "symbol": "CM_VISUALIZATION_STEEL_DESIGN_IN_ELEMENT_LENGTHS",
            "label": "Eleman Boyları",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12085-212540033",
            "commandId": 12085,
            "symbol": "CM_VISUALIZATION_STEEL_DESIGN_IN_SHEETING_OWN_LOADS",
            "label": "Kaplama Zati  Yükleri",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12086-212540726",
            "commandId": 12086,
            "symbol": "CM_VISUALIZATION_STEEL_DESIGN_IN_SHEETING_SNOW_LOADS",
            "label": "Kaplama Kar Yükleri",
            "large": false,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Analiz ve Tasarım Görüntüleme-panel-8",
        "label": "Tasarım",
        "commands": [
          {
            "id": "r25955-12106-212541734",
            "commandId": 12106,
            "symbol": "CM_RIBBON_MENU_DUMMY_COMMAND",
            "label": "Betonarme",
            "large": true,
            "children": [
              {
                "id": "r25955-15739-212542397",
                "commandId": 15739,
                "symbol": "CM_VISUALIZATION_CONCRETE_DESIGN_OUT_CRITICAL_SHEARWALLS",
                "label": "Kritik Perde Yüksekliği",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-15730-212543162",
                "commandId": 15730,
                "symbol": "CM_VISUALIZATION_CONCRETE_DESIGN_OUT_LONGITUDINAL_REBAR_PERCENTAGE_COLUMNS",
                "label": "Boyuna donatı pursantajı (%-Kolonlar)",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-15731-212543959",
                "commandId": 15731,
                "symbol": "CM_VISUALIZATION_CONCRETE_DESIGN_OUT_LONGITUDINAL_REBAR_PERCENTAGE_SHEARWALLS",
                "label": "Boyuna donatı pursantajı (%-Perdeler)",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-15732-212544759",
                "commandId": 15732,
                "symbol": "CM_VISUALIZATION_CONCRETE_DESIGN_OUT_LONGITUDINAL_REBAR_PERCENTAGE_BEAM_SPANS",
                "label": "Boyuna donatı pursantajı (%-Kiriş açıklıkları)",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-15733-212545573",
                "commandId": 15733,
                "symbol": "CM_VISUALIZATION_CONCRETE_DESIGN_OUT_LONGITUDINAL_REBAR_PERCENTAGE_BEAM_ENDPOINTS",
                "label": "Boyuna donatı pursantajı (%-Kiriş mesnetleri)",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-12107-212546437",
            "commandId": 12107,
            "symbol": "CM_RIBBON_MENU_DUMMY_COMMAND",
            "label": "Çelik",
            "large": true,
            "children": [
              {
                "id": "r25955-15753-212547097",
                "commandId": 15753,
                "symbol": "CM_VISUALIZATION_STEEL_DESIGN_IN_BENDING_CAP_MAJ",
                "label": "Eğilme Kapasitesi - Major Eksen",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-15754-212547861",
                "commandId": 15754,
                "symbol": "CM_VISUALIZATION_STEEL_DESIGN_IN_BENDING_CAP_MIN",
                "label": "Eğilme kapasitesi - Minor eksen",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12088-212548625",
                "commandId": 12088,
                "symbol": "CM_VISUALIZATION_STEEL_DESIGN_OUT_PMM_RATIOS",
                "label": "PMM Oranları",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-15755-212549366",
                "commandId": 15755,
                "symbol": "CM_VISUALIZATION_STEEL_DESIGN_IN_SHEAR_CAP_MAJ",
                "label": "Kesme kapasiteleri - Major eksen",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-15756-212550128",
                "commandId": 15756,
                "symbol": "CM_VISUALIZATION_STEEL_DESIGN_IN_SHEAR_CAP_MIN",
                "label": "Kesme Kapasiteleri - Minor eksen",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12090-212550890",
                "commandId": 12090,
                "symbol": "CM_VISUALIZATION_STEEL_DESIGN_OUT_AXIAL_RATIOS",
                "label": "Eksenel kapasite oranları",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-15765-212551646",
                "commandId": 15765,
                "symbol": "CM_VISUALIZATION_STEEL_DESIGN_OUT_CASTELLATED_BEAM_DESIGN_RATIOS",
                "label": "Petek kiriş tasarım oranları",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-15766-212552425",
                "commandId": 15766,
                "symbol": "CM_VISUALIZATION_STEEL_DESIGN_OUT_COMPOSITE_BEAM_DESIGN_RATIOS",
                "label": "Kompozit kiriş tasarım oranları",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-15767-212553205",
                "commandId": 15767,
                "symbol": "CM_VISUALIZATION_STEEL_DESIGN_OUT_MAJOR_SHEAR_RATIOS",
                "label": "Kesme kapasitesi oranları - Major eksen",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-15768-212553981",
                "commandId": 15768,
                "symbol": "CM_VISUALIZATION_STEEL_DESIGN_OUT_MINOR_SHEAR_RATIOS",
                "label": "Kesme kapasitesi oranları - Minor eksen",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-15772-212554757",
                "commandId": 15772,
                "symbol": "CM_VISUALIZATION_STEEL_DESIGN_OUT_CONNECTION_DC_RATIOS",
                "label": "Birleşim D/K oranları",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-12108-212555569",
            "commandId": 12108,
            "symbol": "",
            "label": "Peformans",
            "large": true,
            "children": [
              {
                "id": "r25955-15740-212556207",
                "commandId": 15740,
                "symbol": "CM_VISUALIZATION_CONCRETE_DESIGN_OUT_PERFORMANCE_ANALYSIS_BRITTLE_ELEMENTS",
                "label": "Performans analizi - gevrek elemanlar",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-15741-212557002",
                "commandId": 15741,
                "symbol": "CM_VISUALIZATION_CONCRETE_DESIGN_OUT_PERFORMANCE_ANALYSIS_RESULT_0",
                "label": "Performans analiz sonuçları (0)",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-15742-212557785",
                "commandId": 15742,
                "symbol": "CM_VISUALIZATION_CONCRETE_DESIGN_OUT_PERFORMANCE_ANALYSIS_RESULT_1",
                "label": "Performans analiz sonuçları (1)",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-15743-212558568",
                "commandId": 15743,
                "symbol": "CM_VISUALIZATION_CONCRETE_DESIGN_OUT_PERFORMANCE_ANALYSIS_RESULT_2",
                "label": "Performans analiz sonuçları (2)",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-15744-212559351",
                "commandId": 15744,
                "symbol": "CM_VISUALIZATION_CONCRETE_DESIGN_OUT_PERFORMANCE_ANALYSIS_RESULT_3",
                "label": "Performans analiz sonuçları (3)",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-15745-212560134",
                "commandId": 15745,
                "symbol": "CM_VISUALIZATION_CONCRETE_DESIGN_OUT_PERFORMANCE_ANALYSIS_RESULT_4",
                "label": "Performans analiz sonuçları (4)",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-15746-212560917",
                "commandId": 15746,
                "symbol": "CM_VISUALIZATION_CONCRETE_DESIGN_OUT_PERFORMANCE_ANALYSIS_RESULT_5",
                "label": "Performans analiz sonuçları (5)",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-15747-212561700",
                "commandId": 15747,
                "symbol": "CM_VISUALIZATION_CONCRETE_DESIGN_OUT_PERFORMANCE_ANALYSIS_RESULT_6",
                "label": "Performans analiz sonuçları (6)",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-15748-212562483",
                "commandId": 15748,
                "symbol": "CM_VISUALIZATION_CONCRETE_DESIGN_OUT_PERFORMANCE_ANALYSIS_RESULT_7",
                "label": "Performans analiz sonuçları (7)",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Analiz ve Tasarım Görüntüleme-panel-9",
        "label": "Sonuç",
        "commands": [
          {
            "id": "r25955-13680-212563631",
            "commandId": 13680,
            "symbol": "CM_GEOMETRY_CHECK",
            "label": "Geometri Kontrolü",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12078-212564269",
            "commandId": 12078,
            "symbol": "CM_VISUALIZATION_CONCRETE_DESIGN_OUT_ALL_FAILURES",
            "label": "Betonarme Yetersizlikler",
            "large": true,
            "children": [
              {
                "id": "r25955-1275-212564968",
                "commandId": 1275,
                "symbol": "CM_VISUALIZATION_CONCRETE_DESIGN_OUT_SECTION_FAILURE",
                "label": "Beton Kesit Yetersizliği",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12079-212565709",
                "commandId": 12079,
                "symbol": "CM_VISUALIZATION_CONCRETE_DESIGN_OUT_SHEAR_FAILURE",
                "label": "Kesme kapasitesi yetersizliği",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12080-212566473",
                "commandId": 12080,
                "symbol": "CM_VISUALIZATION_CONCRETE_DESIGN_OUT_INSUFF_REBAR_AREA",
                "label": "Donatı alanı yetersizliği",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12109-212567239",
                "commandId": 12109,
                "symbol": "CM_VISUALIZATION_CONCRETE_DESIGN_OUT_CAPACITY_RATIO",
                "label": "Betonarme Kapasite Oranı",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12081-212568001",
                "commandId": 12081,
                "symbol": "CM_VISUALIZATION_CONCRETE_DESIGN_OUT_REBAR_PERC_LIMIT",
                "label": "Donatı Pursantajı Sınır Aşımı",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12082-212568774",
                "commandId": 12082,
                "symbol": "CM_VISUALIZATION_CONCRETE_DESIGN_OUT_COLUMN_BEAM_JOINT_AREA",
                "label": "Kolon-Kiriş Birleşim Bölgesi",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12083-212569548",
                "commandId": 12083,
                "symbol": "CM_VISUALIZATION_CONCRETE_DESIGN_OUT_PUNCHING_FAILURE_STORY",
                "label": "Zımbalama Hatası (Kat Döşemeleri)",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12100-212570328",
                "commandId": 12100,
                "symbol": "CM_VISUALIZATION_CONCRETE_DESIGN_OUT_PUNCHING_FAILURE_FOUNDATION",
                "label": "Zımbalama Hatası (Radye Döşemeleri)",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-15734-212571115",
                "commandId": 15734,
                "symbol": "CM_VISUALIZATION_CONCRETE_DESIGN_OUT_DEFLECTION_FAILURE",
                "label": "Sehim sınırı aşılması",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-15735-212571881",
                "commandId": 15735,
                "symbol": "CM_VISUALIZATION_CONCRETE_DESIGN_OUT_CONCRETE_CRACK_FAILURE",
                "label": "Çatlak sınırı aşılması",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-15736-212572653",
                "commandId": 15736,
                "symbol": "CM_VISUALIZATION_CONCRETE_DESIGN_OUT_AXIAL_FAILURE",
                "label": "Eksenel kapasite yetersizliği",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-15737-212573417",
                "commandId": 15737,
                "symbol": "CM_VISUALIZATION_CONCRETE_DESIGN_OUT_INSUFFICIENT_DEVELOPMENT_LENGTH",
                "label": "Yetersiz donatı kenetlenme boyu",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-15738-212574201",
                "commandId": 15738,
                "symbol": "CM_VISUALIZATION_CONCRETE_DESIGN_OUT_TORSIONAL_FAILURE",
                "label": "Yetersiz burulma dayanımı",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-376-212574966",
                "commandId": 376,
                "symbol": "CM_VISUALIZATION_CONCRETE_DESIGN_OUT_BEARING_CAPACITY_FAILURE_FOUNDATIONS",
                "label": "Temel Taşıma Gücü Kontrolü",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-1276-212575733",
                "commandId": 1276,
                "symbol": "CM_VISUALIZATION_CONCRETE_DESIGN_OUT_FRICTION_SHEAR_FAILURE",
                "label": "Sürtünme Kesmesi Hatası",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-12087-212576533",
            "commandId": 12087,
            "symbol": "CM_VISUALIZATION_STEEL_DESIGN_OUT_ALL_FAILURES",
            "label": "Çelik Yetersizlikler",
            "large": true,
            "children": [
              {
                "id": "r25955-12089-212577226",
                "commandId": 12089,
                "symbol": "CM_VISUALIZATION_STEEL_DESIGN_OUT_PMM_FAILURE",
                "label": "PMM yetersizliği",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12091-212577972",
                "commandId": 12091,
                "symbol": "CM_VISUALIZATION_STEEL_DESIGN_OUT_DEFLECTION_FAILURE",
                "label": "Sehim sınırı aşılması",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-15769-212578735",
                "commandId": 15769,
                "symbol": "CM_VISUALIZATION_STEEL_DESIGN_OUT_SHEAR_FAILURE",
                "label": "Kesme kapasitesi yetersizliği",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-15770-212579496",
                "commandId": 15770,
                "symbol": "CM_VISUALIZATION_STEEL_DESIGN_OUT_AXIAL_FAILURE",
                "label": "Eksenel kapasite yetersizliği",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-15773-212580257",
                "commandId": 15773,
                "symbol": "CM_VISUALIZATION_STEEL_DESIGN_OUT_CONNECTION_FAILURES",
                "label": "Birleşim yetersizlikleri",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Analiz ve Tasarım Görüntüleme-panel-10",
        "label": "Analiz",
        "commands": [
          {
            "id": "r25955-11760-212581384",
            "commandId": 11760,
            "symbol": "CM_COMPLETE_ANALYSIS",
            "label": "Analiz Tasarım",
            "large": true,
            "children": [
              {
                "id": "r25955-11800-212581857",
                "commandId": 11800,
                "symbol": "CM_SLAB_ANALYSIS",
                "label": "Döşeme Analizi",
                "large": false,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-2565-212582370",
                "commandId": 2565,
                "symbol": "CM_STAIR_ANALYSIS",
                "label": "Merdiven Analizi",
                "large": false,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40594-212582883",
                "commandId": 40594,
                "symbol": "CM_POOL_ANALYSIS",
                "label": "Havuz Analizi",
                "large": false,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-2587-212583393",
                "commandId": 2587,
                "symbol": "CM_DOMEVAULT_ANALYSIS",
                "label": "Kubbe ve Tonoz Analizi",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212583936",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-40570-212584096",
                "commandId": 40570,
                "symbol": "CM_RETWALL_ANALYSIS",
                "label": "İstinat Duvarı Analizi",
                "large": false,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-64486-212584620",
                "commandId": 64486,
                "symbol": "CM_WELLFOUND_ANALYSIS",
                "label": "Kuyu Temel Analizi",
                "large": false,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212585144",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-15171-212585304",
                "commandId": 15171,
                "symbol": "CM_PUSHOVER_ANALYSIS",
                "label": "Nonlineer İtme Analizi",
                "large": false,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40556-212585828",
                "commandId": 40556,
                "symbol": "CM_LINEAR_PERFORMANCE_ANALYSIS",
                "label": "Doğrusal Performans Analizi",
                "large": false,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40557-212586367",
                "commandId": 40557,
                "symbol": "CM_RISKY_STRUCTURE_ANALYSIS",
                "label": "Riskli Bina Analizi",
                "large": false,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212586894",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": true,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-13701-212587109",
                "commandId": 13701,
                "symbol": "CM_MODIFY_FINITE_ELEMENT_MESH_SIZES",
                "label": "Sonlu Eleman Genişliklerini Değiştir",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          }
        ]
      }
    ]
  },
  {
    "id": "Raporlar",
    "label": "Raporlar",
    "panels": [
      {
        "id": "r25955-Raporlar-panel-0",
        "label": "Özet",
        "commands": [
          {
            "id": "r25955-12270-212588515",
            "commandId": 12270,
            "symbol": "CM_ALL_STATIC_REPORTS",
            "label": "Seçmeli Raporlar",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12032-212588958",
            "commandId": 12032,
            "symbol": "CM_STRUCTURE_SUMMARY_REPORT",
            "label": "Yapı Özet Bilgileri",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212589406",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-12033-212589550",
            "commandId": 12033,
            "symbol": "CM_ANALYSIS_SETTINGS_REPORT",
            "label": "Analiz Ayarları Raporu",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12034-212589995",
            "commandId": 12034,
            "symbol": "CM_CONCRETE_DESIGN_REPORT",
            "label": "Betonarme Dizayn Ayarları Raporu",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12035-212590438",
            "commandId": 12035,
            "symbol": "CM_TBDY_2018_SEISMIC_PARAMETERS_REPORT",
            "label": "TBDY 2018 Deprem Parametreleri Raporu",
            "large": false,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Raporlar-panel-1",
        "label": "Döşeme",
        "commands": [
          {
            "id": "r25955-40162-212591210",
            "commandId": 40162,
            "symbol": "CM_SLAB_GENERAL_REPORT",
            "label": "Döşeme",
            "large": true,
            "children": [
              {
                "id": "r25955-40161-212591646",
                "commandId": 40161,
                "symbol": "CM_SLAB_DETAILED_GENERAL_REPORT",
                "label": "Döşeme Detaylı",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12115-212592138",
                "commandId": 12115,
                "symbol": "CM_RIB_GENERAL_REPORT",
                "label": "Nervür",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12125-212592646",
                "commandId": 12125,
                "symbol": "CM_WAFFLE_GENERAL_REPORT",
                "label": "Kaset",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Raporlar-panel-2",
        "label": "Betonarme",
        "commands": [
          {
            "id": "r25955-14440-212593523",
            "commandId": 14440,
            "symbol": "CM_BEAM_GENERAL_REPORT",
            "label": "Kiriş",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-14500-212593951",
            "commandId": 14500,
            "symbol": "CM_COLUMN_GENERAL_REPORT",
            "label": "Kolon",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12150-212594380",
            "commandId": 12150,
            "symbol": "CM_SHEARWALL_GENERAL_REPORT",
            "label": "Perde",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-28143-212594844",
            "commandId": 28143,
            "symbol": "CM_COMPOUND_SHEARWALL_REPORT",
            "label": "Perde Grubu",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212595285",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-40164-212595430",
            "commandId": 40164,
            "symbol": "CM_STAIR_GENERAL_REPORT",
            "label": "Merdiven Genel Raporu",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-2592-212595871",
            "commandId": 2592,
            "symbol": "CM_DOMEVAULT_RESULTS_REPORT",
            "label": "Kubbe - Tonoz Sonuçları Raporu",
            "large": false,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Raporlar-panel-3",
        "label": "Temel - Zemin",
        "commands": [
          {
            "id": "r25955-40163-212596668",
            "commandId": 40163,
            "symbol": "CM_FOUNDATION_SLAB_GENERAL_REPORT",
            "label": "Radye Temel",
            "large": true,
            "children": [
              {
                "id": "r25955-40201-212597118",
                "commandId": 40201,
                "symbol": "CM_FOUNDATION_SLAB_DETAILED_GENERAL_REPORT",
                "label": "Radye Temel Detaylı",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212597675",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-12186-212597819",
            "commandId": 12186,
            "symbol": "CM_STRIP_FOUNDATION_GENERAL_REPORT",
            "label": "Sürekli Temel Raporu",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12190-212598274",
            "commandId": 12190,
            "symbol": "CM_SINGULAR_FOUNDATION_REPORT",
            "label": "Tekil Temel Raporu",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-14778-212598753",
            "commandId": 14778,
            "symbol": "CM_PILE_GENERAL_REPORT",
            "label": "Kazık Genel Raporu",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12200-212599193",
            "commandId": 12200,
            "symbol": "CM_FOUNDATION_TIE_REPORT",
            "label": "Temel Bağ Kirişi Raporu",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212599635",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-40574-212599779",
            "commandId": 40574,
            "symbol": "CM_RETWALL_CALC_REPORT",
            "label": "İstinat Duvarı",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-14786-212600217",
            "commandId": 14786,
            "symbol": "CM_WELL_FOUNDATION_REPORT",
            "label": "Kuyu Temel",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212600652",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": true,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-12037-212600848",
            "commandId": 12037,
            "symbol": "CM_PREDESIGN_RESULTS_FOR_GEOTECHNIC_REPORT",
            "label": "Geoteknik Raporu",
            "large": true,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Raporlar-panel-4",
        "label": "Dinamik Analiz",
        "commands": [
          {
            "id": "r25955-12030-212601630",
            "commandId": 12030,
            "symbol": "CM_DYNAMIC_ANALYSIS_REPORT",
            "label": "Dinamik Analiz",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12050-212602102",
            "commandId": 12050,
            "symbol": "CM_STORY_FORCES_REPORT",
            "label": "Kat Kuvvetleri",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-65186-212602574",
            "commandId": 65186,
            "symbol": "CM_SEISMIC_ISOLATORS_REPORT",
            "label": "Deprem İzolatörleri",
            "large": true,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Raporlar-panel-5",
        "label": "ŞGDT",
        "commands": [
          {
            "id": "r25955-12261-212603335",
            "commandId": 12261,
            "symbol": "CM_PUSHOVER_REPORT",
            "label": "Nonlineer İtme",
            "large": true,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Raporlar-panel-6",
        "label": "Deprem Yönetmeliği",
        "commands": [
          {
            "id": "r25955-12220-212604157",
            "commandId": 12220,
            "symbol": "CM_DEPYON_GENERAL_REPORT",
            "label": "Deprem Yönetmeliği Genel Raporu",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12260-212604647",
            "commandId": 12260,
            "symbol": "CM_COLBEAM_JOIN_REPORT",
            "label": "Kolon-Kiriş Birleşim Güvenliği",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-1383-212605135",
            "commandId": 1383,
            "symbol": "CM_TBDY_NON_STRUCTURAL_ELEMENT_FORCES_REPORT",
            "label": "TBDY Yapısal Olmayan Eleman Kuvvetleri Raporu",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40015-212605656",
            "commandId": 40015,
            "symbol": "CM_SEISMIC_JOINT_THICKNESS_REPORT",
            "label": "TBDY Deprem Derzi",
            "large": true,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Raporlar-panel-7",
        "label": "Çelik",
        "commands": [
          {
            "id": "r25955-14442-212606452",
            "commandId": 14442,
            "symbol": "CM_STEEL_COLUMN_REPORT",
            "label": "Çelik Kolon",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-14441-212606886",
            "commandId": 14441,
            "symbol": "CM_STEEL_BEAM_REPORT",
            "label": "Çelik Kiriş",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-14444-212607319",
            "commandId": 14444,
            "symbol": "CM_STEEL_SECONDARY_BEAM_REPORT",
            "label": "Tali Çelik Kiriş",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-14443-212607772",
            "commandId": 14443,
            "symbol": "CM_STEEL_PURLIN_REPORT",
            "label": "Çelik Aşık",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-14447-212608207",
            "commandId": 14447,
            "symbol": "CM_TRUSS_REPORT",
            "label": "Makas",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-14352-212608627",
            "commandId": 14352,
            "symbol": "CM_SPACE_TRUSS_REPORT",
            "label": "Uzay Kafes",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-14353-212609060",
            "commandId": 14353,
            "symbol": "CM_STEEL_JOIST_REPORT",
            "label": "R Aşık",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-14354-212609491",
            "commandId": 14354,
            "symbol": "CM_SPACE_PURLIN_REPORT",
            "label": "Uzay Aşık",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-14445-212609926",
            "commandId": 14445,
            "symbol": "CM_CONCENTRIC_BRACE_REPORT",
            "label": "Merkezi Çapraz",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-14446-212610367",
            "commandId": 14446,
            "symbol": "CM_ECCENTRIC_BRACE_REPORT",
            "label": "Dışmerkez Çapraz",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-14502-212610811",
            "commandId": 14502,
            "symbol": "CM_CRANE_REPORT",
            "label": "Kren Tasarım",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-28057-212611239",
            "commandId": 28057,
            "symbol": "CM_COMPOSITE_BEAM_REPORT",
            "label": "Kompozit Kiriş",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-28059-212611678",
            "commandId": 28059,
            "symbol": "CM_CASTELLATED_BEAM_REPORT",
            "label": "Petek Kiriş",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-28139-212612116",
            "commandId": 28139,
            "symbol": "CM_COMPOSITE_CASTELLATED_BEAM_REPORT",
            "label": "Kompozit Petek Kiriş",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-28079-212612575",
            "commandId": 28079,
            "symbol": "CM_CONNECTION_DESIGN_SUMMARY_REPORT",
            "label": "Birleşim",
            "large": true,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Raporlar-panel-8",
        "label": "Kalıp Planı",
        "commands": [
          {
            "id": "r25955-1330-212613340",
            "commandId": 1330,
            "symbol": "CM_CONCRETE_FORMWORK_REPORT",
            "label": "Kalıp İskelesi Raporu",
            "large": true,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Raporlar-panel-9",
        "label": "Metraj",
        "commands": [
          {
            "id": "r25955-12210-212614105",
            "commandId": 12210,
            "symbol": "CM_MEASURE_REPORT",
            "label": "Metraj",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-14448-212614560",
            "commandId": 14448,
            "symbol": "CM_STEEL_SINGLEPART_ASSEMBLY_REPORT",
            "label": "Detaylı Çelik Metrajı",
            "large": true,
            "children": [],
            "type": "Button"
          }
        ]
      }
    ]
  },
  {
    "id": "Çizimler",
    "label": "Çizimler",
    "panels": [
      {
        "id": "r25955-Çizimler-panel-0",
        "label": "Pencere",
        "commands": [
          {
            "id": "r25955-12175-212615826",
            "commandId": 12175,
            "symbol": "CM_RIBBON_MENU_RETURN_TO_LAST_STORY_WINDOW",
            "label": "Pencere Değiştir",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212616335",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-15700-212616479",
            "commandId": 15700,
            "symbol": "CM_RIBBON_MENU_WINDOW_LIST_STORIES",
            "label": "Kat listesi",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-15701-212616924",
            "commandId": 15701,
            "symbol": "CM_RIBBON_MENU_WINDOW_LIST_DRAWINGS",
            "label": "Çizim Listesi",
            "large": true,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Çizimler-panel-1",
        "label": "Çizim Oluştur",
        "commands": [
          {
            "id": "r25955-11307-212617696",
            "commandId": 11307,
            "symbol": "CM_DRAWINGS_CONCRETE_CATEGORY",
            "label": "Betonarme",
            "large": true,
            "children": [
              {
                "id": "r25955-11990-212618172",
                "commandId": 11990,
                "symbol": "CM_STATIC_PLAN",
                "label": "Kalıp Planı",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-2465-212618683",
                "commandId": 2465,
                "symbol": "CM_COLUMN_APPLICATION_PLAN2",
                "label": "Kolon Aplikasyon Planı",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-63387-212619176",
                "commandId": 63387,
                "symbol": "CM_PANEL_VERTICAL_DRAWINGS2",
                "label": "Perde Detayları",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-63386-212619699",
                "commandId": 63386,
                "symbol": "CM_COLUMN_VERTICAL_DRAWINGS2",
                "label": "Kolon Düşey Açılımları",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-63389-212620199",
                "commandId": 63389,
                "symbol": "CM_BEAM_DRAWINGS2",
                "label": "Kiriş Açılımları",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11960-212620717",
                "commandId": 11960,
                "symbol": "CM_NERVUR_DRAWINGS",
                "label": "Nervür Açılımları",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11970-212621237",
                "commandId": 11970,
                "symbol": "CM_CASETTE_DRAWINGS",
                "label": "Kaset Açılımları",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-12000-212621760",
                "commandId": 12000,
                "symbol": "CM_FOUNDATION_APPLICATION_PLAN",
                "label": "Temel Aplikasyon Planı",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11980-212622293",
                "commandId": 11980,
                "symbol": "CM_FOUNDATION_DRAWINGS",
                "label": "Sürekli Temel Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11940-212622820",
                "commandId": 11940,
                "symbol": "CM_SFOUND_DRAWINGS",
                "label": "Tekil Temel Açılımları",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11930-212623344",
                "commandId": 11930,
                "symbol": "CM_CONBEAM_DRAWINGS",
                "label": "Temel Bağ Kirişi Açılımları",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-11910-212623876",
                "commandId": 11910,
                "symbol": "CM_HORIZONTAL_COLBEAM_JOINT_SECTION",
                "label": "Kolon-Kiriş Birleşim Bölgesi Kesiti",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212624429",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-40572-212624589",
                "commandId": 40572,
                "symbol": "CM_RETAINING_WALL_DRAWINGS",
                "label": "İstinat Duvarı Açılımları",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-64495-212625090",
                "commandId": 64495,
                "symbol": "CM_WELL_FOUNDATION_DRAWINGS",
                "label": "Kuyu Temel Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-62791-212625582",
                "commandId": 62791,
                "symbol": "CM_STAIR_DRAWINGS",
                "label": "Merdiven Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-14088-212626062",
                "commandId": 14088,
                "symbol": "CM_PILE_DRAWINGS",
                "label": "Kazık Temel Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-112-212626545",
                "commandId": 112,
                "symbol": "CM_DOME_DRAWINGS",
                "label": "Kubbe Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-40880-212627070",
            "commandId": 40880,
            "symbol": "CM_CREATE_STEEL_DRAWING_GENERAL_CONSTRUCTION_WITH_PARTS",
            "label": "Çelik",
            "large": true,
            "children": [
              {
                "id": "r25955-40755-212627569",
                "commandId": 40755,
                "symbol": "CM_CREATE_STEEL_DRAWINGS",
                "label": "Çelik Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-846-212628090",
                "commandId": 846,
                "symbol": "CM_CREATE_POINT_DETAIL_GROUP_AUTO",
                "label": "Nokta Detayı Seçimi",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-1258-212628624",
                "commandId": 1258,
                "symbol": "CM_POINT_DETAILS_LIST",
                "label": "Nokta Detayı Listesi",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212629147",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-40870-212629307",
                "commandId": 40870,
                "symbol": "CM_CREATE_STEEL_DRAWING_SINGLE_PART",
                "label": "Tekil Eleman Çizimi",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40871-212629806",
                "commandId": 40871,
                "symbol": "CM_CREATE_STEEL_DRAWING_ASSEMBLY",
                "label": "Montaj Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40872-212630299",
                "commandId": 40872,
                "symbol": "CM_CREATE_STEEL_DRAWING_ASSEMBLY_WITH_SINGLE",
                "label": "Tekil Elemanlarla Montaj Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40873-212630822",
                "commandId": 40873,
                "symbol": "CM_CREATE_STEEL_DRAWING_COLUMN_ANCHORAGE",
                "label": "Kolon Ankraj Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40874-212631329",
                "commandId": 40874,
                "symbol": "CM_CREATE_STEEL_DRAWING_PLAN",
                "label": "Aplikasyon Planı Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40875-212631829",
                "commandId": 40875,
                "symbol": "CM_CREATE_STEEL_DRAWING_AXIS",
                "label": "Aks ve Cephe Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40876-212632324",
                "commandId": 40876,
                "symbol": "CM_CREATE_STEEL_DRAWING_ROOF_PLAN",
                "label": "Çatı Plan Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40877-212632823",
                "commandId": 40877,
                "symbol": "CM_CREATE_STEEL_DRAWING_TRUSS",
                "label": "Makas Çizimi",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40878-212633309",
                "commandId": 40878,
                "symbol": "CM_CREATE_STEEL_DRAWING_3D",
                "label": "3B İzometrik Görünüş Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40879-212633815",
                "commandId": 40879,
                "symbol": "CM_CREATE_STEEL_DRAWING_GENERAL_CONSTRUCTION",
                "label": "Genel Konstrüksiyon Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40880-212634334",
                "commandId": 40880,
                "symbol": "CM_CREATE_STEEL_DRAWING_GENERAL_CONSTRUCTION_WITH_PARTS",
                "label": "Genel Konstrüksiyon Çizimleri - Tekil Eleman ve Montajlar Dahil",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212634898",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-495-212635058",
                "commandId": 495,
                "symbol": "CM_CREATE_SCAFFOLDING_DRAWINGS",
                "label": "İskele Çizimleri",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-2126-212635599",
            "commandId": 2126,
            "symbol": "CM_CONCRETE_FORMWORK_DRAWINGS",
            "label": "Kalıp İskelesi Çizimleri",
            "large": true,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Çizimler-panel-2",
        "label": "İlkel Objeler",
        "commands": [
          {
            "id": "r25955-12930-212636456",
            "commandId": 12930,
            "symbol": "CM_DRAW_MULTILINE",
            "label": "Sürekli Çizgi",
            "large": true,
            "children": [
              {
                "id": "r25955-12940-212636924",
                "commandId": 12940,
                "symbol": "CM_DRAW_RECTANGLELINE",
                "label": "Dikdörtgen",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-40576-212637485",
            "commandId": 40576,
            "symbol": "CM_DRAW_PATH",
            "label": "Rota",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12950-212637947",
            "commandId": 12950,
            "symbol": "CM_DRAW_CIRCLE",
            "label": "Çember",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12970-212638378",
            "commandId": 12970,
            "symbol": "CM_DRAW_ARC_3P",
            "label": "Yay-3 Noktadan",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40640-212638866",
            "commandId": 40640,
            "symbol": "CM_DRAW_REVISION_CLOUD",
            "label": "Revizyon Bulutu",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40650-212639306",
            "commandId": 40650,
            "symbol": "CM_DRAW_PATTERNPATH",
            "label": "Desen Hattı",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40168-212639743",
            "commandId": 40168,
            "symbol": "CM_DRAW_ELLIPSE_CORNERS",
            "label": "Elips Köşeler",
            "large": false,
            "children": [
              {
                "id": "r25955-40169-212640222",
                "commandId": 40169,
                "symbol": "CM_DRAW_ELLIPSE_CENTER_CORNER",
                "label": "Elips Merkez-Köşe",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40170-212640750",
                "commandId": 40170,
                "symbol": "CM_DRAW_ELLIPSE_MID_AXIS",
                "label": "Elips Orta-Eksen",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40171-212641270",
                "commandId": 40171,
                "symbol": "CM_DRAW_ELLIPTICAL_ARC_CORNERS",
                "label": "Eliptik Yay Köşeler",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40172-212641801",
                "commandId": 40172,
                "symbol": "CM_DRAW_ELLIPTICAL_ARC_CENTER_CORNER",
                "label": "Eliptik Yay Merkez-Köşe",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40173-212642342",
                "commandId": 40173,
                "symbol": "CM_DRAW_ELLIPTICAL_ARC_MID_AXIS",
                "label": "Eliptik Yay Orta-Eksen-Açılar",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-14000-212642935",
            "commandId": 14000,
            "symbol": "CM_DRAW_NURBS",
            "label": "NURBS Eğrisi",
            "large": false,
            "children": [
              {
                "id": "r25955-13990-212643404",
                "commandId": 13990,
                "symbol": "CM_DRAW_BEZIER",
                "label": "Bezier",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-14010-212643904",
                "commandId": 14010,
                "symbol": "CM_DRAW_CLOSED_BEZIER",
                "label": "Kapalı Bezier",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-14020-212644419",
                "commandId": 14020,
                "symbol": "CM_DRAW_CLOSED_NURBS",
                "label": "Kapalı NURBS",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-14330-212644983",
            "commandId": 14330,
            "symbol": "CM_DRAW_FREEHAND",
            "label": "Serbest Çizgi",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-13710-212645453",
            "commandId": 13710,
            "symbol": "CM_DRAW_BMP",
            "label": "Resim",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12990-212645914",
            "commandId": 12990,
            "symbol": "CM_DRAW_LIBRARY",
            "label": "Kütüphane",
            "large": true,
            "children": [
              {
                "id": "r25955-13000-212646376",
                "commandId": 13000,
                "symbol": "CM_SETTINGS_LIBRARY",
                "label": "Kütüphane Ayarları",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Çizimler-panel-3",
        "label": "Değiştir",
        "commands": [
          {
            "id": "r25955-12610-212647294",
            "commandId": 12610,
            "symbol": "CM_STRETCH_NODE",
            "label": "Düğüm Noktası Taşı",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12640-212647758",
            "commandId": 12640,
            "symbol": "CM_ROTATE_NODE",
            "label": "D.N. Döndür",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-850-212648221",
            "commandId": 850,
            "symbol": "CM_FAST_MOVE",
            "label": "Hızlı Taşıma",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212648698",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-13470-212648842",
            "commandId": 13470,
            "symbol": "CM_OBJECT_EDIT",
            "label": "Obje Özellikleri",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-13070-212649306",
            "commandId": 13070,
            "symbol": "CM_GET_SETTINGS_FROM_ENTITY",
            "label": "Objeden Ayarları Al",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40131-212649782",
            "commandId": 40131,
            "symbol": "CM_SET_SETTINGS_DEFAULT",
            "label": "Objeye Ayarları Ver",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212650255",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-13190-212650399",
            "commandId": 13190,
            "symbol": "CM_MOVE",
            "label": "Taşı",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40122-212650843",
            "commandId": 40122,
            "symbol": "CM_ROTATE",
            "label": "Döndür",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-13230-212651301",
            "commandId": 13230,
            "symbol": "CM_MIRROR",
            "label": "Simetri",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-65123-212651759",
            "commandId": 65123,
            "symbol": "CM_ROTATE_PROJECT",
            "label": "Yapıyı Döndür",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212652243",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-13770-212652387",
            "commandId": 13770,
            "symbol": "CM_SCALE_BY_REF",
            "label": "Ölçekle(referans)",
            "large": false,
            "children": [
              {
                "id": "r25955-13760-212652858",
                "commandId": 13760,
                "symbol": "CM_SCALE_BY_DIST",
                "label": "Ölçek",
                "large": false,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-11212-212653412",
            "commandId": 11212,
            "symbol": "CM_ALIGN",
            "label": "Objeleri Hizala",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-11213-212653870",
            "commandId": 11213,
            "symbol": "CM_DISTRIBUTE",
            "label": "Objeleri Dağıt",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-13200-212654333",
            "commandId": 13200,
            "symbol": "CM_TRIM",
            "label": "Trim",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-13960-212654789",
            "commandId": 13960,
            "symbol": "CM_CHAMFER",
            "label": "Chamfer",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40219-212655249",
            "commandId": 40219,
            "symbol": "CM_MAKE_BLOCK",
            "label": "Blok Yap",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-13210-212655712",
            "commandId": 13210,
            "symbol": "CM_EXTEND",
            "label": "Uzat",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-13950-212656170",
            "commandId": 13950,
            "symbol": "CM_FILLET",
            "label": "Fillet",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-13700-212656633",
            "commandId": 13700,
            "symbol": "CM_GENERAL_EXPLODE",
            "label": "Obje Parçala",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212657101",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-13220-212657245",
            "commandId": 13220,
            "symbol": "CM_OFFSET",
            "label": "Ofset",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12982-212657690",
            "commandId": 12982,
            "symbol": "CM_DIVIDE",
            "label": "Böl",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-13940-212658149",
            "commandId": 13940,
            "symbol": "CM_BREAK",
            "label": "Break",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-13231-212658607",
            "commandId": 13231,
            "symbol": "CM_JOIN",
            "label": "Birleştir",
            "large": false,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Çizimler-panel-4",
        "label": "Düzenle",
        "commands": [
          {
            "id": "r25955-13670-212659380",
            "commandId": 13670,
            "symbol": "CM_CLONE",
            "label": "Klonla",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12490-212659827",
            "commandId": 12490,
            "symbol": "CM_EDIT_COPY",
            "label": "Kopyala",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12540-212660288",
            "commandId": 12540,
            "symbol": "CM_EDIT_PASTE",
            "label": "Yapıştır",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12500-212660750",
            "commandId": 12500,
            "symbol": "CM_FAST_COPY",
            "label": "Kat Kopyala",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212661211",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-13090-212661355",
            "commandId": 13090,
            "symbol": "CM_ARRAY",
            "label": "Obje Çoğalt",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40068-212661812",
            "commandId": 40068,
            "symbol": "CM_ADV_ARRAY",
            "label": "Gelişmiş Obje Çoğalt",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-13672-212662274",
            "commandId": 13672,
            "symbol": "CM_POLAR_ARRAY",
            "label": "Kutupsal Çoğaltma",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212662738",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-11210-212662882",
            "commandId": 11210,
            "symbol": "CM_SELECT_ALL",
            "label": "Hepsini Seç",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-11220-212663343",
            "commandId": 11220,
            "symbol": "CM_DESELECT_ALL",
            "label": "Hiçbirini Seçme",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-11230-212663806",
            "commandId": 11230,
            "symbol": "CM_INVERT_SELECTION",
            "label": "Seçimi Ters Çevir",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-62938-212664273",
            "commandId": 62938,
            "symbol": "CM_SELECT_LAST_SELECTION",
            "label": "Son Seçim",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-11211-212664747",
            "commandId": 11211,
            "symbol": "CM_SELECT_IN_ALL_STORIES",
            "label": "Objeleri Tüm Katlarda Seç",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-13260-212665189",
            "commandId": 13260,
            "symbol": "CM_ERASE",
            "label": "Sil",
            "large": false,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Çizimler-panel-5",
        "label": "Yakalama",
        "commands": [
          {
            "id": "r25955-40233-212665991",
            "commandId": 40233,
            "symbol": "CM_ACTIVATE_LOCAL_CS",
            "label": "Lokal Koordinat Sistemi Etkinleştir",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40232-212666461",
            "commandId": 40232,
            "symbol": "CM_SET_LOCAL_CS",
            "label": "Lokal Koordinat Sistemi Tanımla",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-13060-212666926",
            "commandId": 13060,
            "symbol": "CM_LOCAL_PNT",
            "label": "Lokal Nokta Tanımla",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212667387",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-11170-212667532",
            "commandId": 11170,
            "symbol": "CM_SNAP",
            "label": "Izgaraya Kilitlen",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-11340-212668004",
            "commandId": 11340,
            "symbol": "CM_NODE_SNAP",
            "label": "D.N. Kilitlen",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-11350-212668482",
            "commandId": 11350,
            "symbol": "CM_EXTENDED_OBJECT_SNAP",
            "label": "Gelişmiş Yakalama",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212668954",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-13450-212669099",
            "commandId": 13450,
            "symbol": "CM_GET_PERP_REF",
            "label": "Dik Referans",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-13460-212669564",
            "commandId": 13460,
            "symbol": "CM_GET_PARL_REF",
            "label": "Paralel Referans",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-11160-212670029",
            "commandId": 11160,
            "symbol": "CM_ORTHO",
            "label": "Dik",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212670485",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-14362-212670630",
            "commandId": 14362,
            "symbol": "CM_DRAW_TANGENT",
            "label": "Teğet",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-11250-212671095",
            "commandId": 11250,
            "symbol": "CM_MIDPOINT_OF",
            "label": "Orta Nokta",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-11280-212671557",
            "commandId": 11280,
            "symbol": "CM_NEAR_TO",
            "label": "En Yakın Nokta",
            "large": false,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Çizimler-panel-6",
        "label": "Referans",
        "commands": [
          {
            "id": "r25955-13660-212672332",
            "commandId": 13660,
            "symbol": "CM_DISTANCE",
            "label": "Uzaklık",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-13650-212672783",
            "commandId": 13650,
            "symbol": "CM_AREA",
            "label": "Alan",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40221-212673240",
            "commandId": 40221,
            "symbol": "CM_ANGLE",
            "label": "Açı",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-2618-212673698",
            "commandId": 2618,
            "symbol": "CM_AS_CALCULATOR",
            "label": "Donatı Alanı Hesapla",
            "large": false,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Çizimler-panel-7",
        "label": "Ölçüler",
        "commands": [
          {
            "id": "r25955-13300-212674510",
            "commandId": 13300,
            "symbol": "CM_FREE_DIMENSION",
            "label": "Serbest Ölçü",
            "large": true,
            "children": [
              {
                "id": "r25955-13280-212674982",
                "commandId": 13280,
                "symbol": "CM_DIMENSION_SETTINGS",
                "label": "Dış Ölçülendirme Ayarları",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-2620-212675514",
                "commandId": 2620,
                "symbol": "CM_INSIDE_DIM_SETTINGS",
                "label": "İç Ölçülendirme Ayarları",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-2621-212676045",
                "commandId": 2621,
                "symbol": "CM_FREE_DIM_SETTINGS",
                "label": "Serbest Ölçülendirme Ayarları",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-13290-212676628",
            "commandId": 13290,
            "symbol": "CM_OUTSIDE_DIMENSION",
            "label": "Dış Ölçülendirme",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-13270-212677097",
            "commandId": 13270,
            "symbol": "CM_INSIDE_DIMENSION",
            "label": "İç Ölçülendirme",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-13310-212677565",
            "commandId": 13310,
            "symbol": "CM_CROSS_DIM",
            "label": "Kesişim Ölçülendirme",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12760-212678027",
            "commandId": 12760,
            "symbol": "CM_DRAW_LEVEL_DIMENSION",
            "label": "Kot",
            "large": true,
            "children": [
              {
                "id": "r25955-12790-212678489",
                "commandId": 12790,
                "symbol": "CM_SETTINGS_LEVEL_DIMENSION",
                "label": "Kot Ayarları",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-13391-212679009",
                "commandId": 13391,
                "symbol": "CM_ANGLE_DIMENSION_SETTINGS",
                "label": "Açı Ölçülendirme Ayarları",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-13392-212679547",
                "commandId": 13392,
                "symbol": "CM_RAD_DIMENSION_SETTINGS",
                "label": "Çap Ölçülendirme Ayarları",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-13380-212680133",
            "commandId": 13380,
            "symbol": "CM_DRAW_SECTION_ELEVATION",
            "label": "Kesit Kot",
            "large": true,
            "children": [
              {
                "id": "r25955-13390-212680605",
                "commandId": 13390,
                "symbol": "CM_SECTION_ELEVATION_SETTINGS",
                "label": "Kesit Kot Ayarları",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-13381-212681184",
            "commandId": 13381,
            "symbol": "CM_DRAW_ANGLE_DIMENSION",
            "label": "Açı ölçülendirme",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-13382-212681657",
            "commandId": 13382,
            "symbol": "CM_DRAW_RAD_DIMENSION",
            "label": "Çap Ölçülendirme",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12780-212682128",
            "commandId": 12780,
            "symbol": "CM_DRAW_LABEL",
            "label": "Etiket",
            "large": false,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Çizimler-panel-8",
        "label": "Donatı",
        "commands": [
          {
            "id": "r25955-14363-212682934",
            "commandId": 14363,
            "symbol": "CM_DRAW_STIRRUP",
            "label": "Çiroz",
            "large": true,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-14364-212683387",
            "commandId": 14364,
            "symbol": "CM_DRAW_ETRIYE",
            "label": "Etriye",
            "large": true,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Çizimler-panel-9",
        "label": "Tarama",
        "commands": [
          {
            "id": "r25955-13400-212684182",
            "commandId": 13400,
            "symbol": "CM_DRAW_HATCH",
            "label": "Tanımlı Tarama",
            "large": true,
            "children": [
              {
                "id": "r25955-13440-212684617",
                "commandId": 13440,
                "symbol": "CM_HATCH_SETTINGS",
                "label": "Tarama Ayarları",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-13420-212685145",
            "commandId": 13420,
            "symbol": "CM_DRAW_SIMPLEHATCH",
            "label": "Parametrik Tarama",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-13430-212685582",
            "commandId": 13430,
            "symbol": "CM_DRAW_BITMAPHATCH",
            "label": "Bitmap Tarama",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-40213-212686019",
            "commandId": 40213,
            "symbol": "CM_DRAW_HATCHHOLE",
            "label": "Tarama Boşluğu",
            "large": false,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Çizimler-panel-10",
        "label": "Yazılar",
        "commands": [
          {
            "id": "r25955-12980-212686802",
            "commandId": 12980,
            "symbol": "CM_DRAW_TEXT",
            "label": "Yazılar",
            "large": true,
            "children": [
              {
                "id": "r25955-13010-212687258",
                "commandId": 13010,
                "symbol": "CM_SETTINGS_FONT",
                "label": "Yazı Ayarları",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-12981-212687820",
            "commandId": 12981,
            "symbol": "CM_DRAW_FORMAT_TEXT",
            "label": "Biçimli Yazı",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-13780-212688293",
            "commandId": 13780,
            "symbol": "CM_IMPORT_TEXT",
            "label": "Yazı Import",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-12480-212688757",
            "commandId": 12480,
            "symbol": "CM_CHANGE_TEXT",
            "label": "Yazı Değiştir",
            "large": false,
            "children": [],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Çizimler-panel-11",
        "label": "Pafta Dizaynı",
        "commands": [
          {
            "id": "r25955-40202-212689571",
            "commandId": 40202,
            "symbol": "CM_NEW_LAYOUT",
            "label": "Yeni Pafta Oluştur",
            "large": true,
            "children": [
              {
                "id": "r25955-40214-212690041",
                "commandId": 40214,
                "symbol": "CM_NEW_LAYOUT_BLOCK_ALL",
                "label": "Yeni Pafta Bloğu-Tüm Çizimler",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40222-212690641",
                "commandId": 40222,
                "symbol": "CM_NEW_LAYOUT_BLOCK_RECTANGLE",
                "label": "Yeni Pafta Bloğu-Dörtgen",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40223-212691176",
                "commandId": 40223,
                "symbol": "CM_NEW_LAYOUT_BLOCK_POLYGON",
                "label": "Yeni Pafta Bloğu-Poligon",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40450-212691708",
                "commandId": 40450,
                "symbol": "CM_NEW_LAYOUT_BLOCK_PATH",
                "label": "Yeni Pafta Bloğu-Poligon Yolu",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40228-212692242",
                "commandId": 40228,
                "symbol": "CM_NEW_LAYOUT_BLOCK_CIRCLE",
                "label": "Yeni Pafta Bloğu-Çember",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212692773",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-40225-212692989",
                "commandId": 40225,
                "symbol": "CM_INSERT_LAYOUT_BLOCK",
                "label": "Pafta Bloğu Ekle",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-40224-212693573",
                "commandId": 40224,
                "symbol": "CM_UPDATE_LAYOUT_BLOCK",
                "label": "Pafta Bloğu Güncelle",
                "large": true,
                "children": [],
                "type": "Button"
              },
              {
                "id": "r25955-separator-212694097",
                "commandId": null,
                "symbol": "",
                "label": "",
                "large": false,
                "children": [],
                "type": "Separator"
              },
              {
                "id": "r25955-40227-212694313",
                "commandId": 40227,
                "symbol": "CM_LAYOUT_SETTINGS",
                "label": "Pafta Ayarları",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          }
        ]
      },
      {
        "id": "r25955-Çizimler-panel-12",
        "label": "Araçlar",
        "commands": [
          {
            "id": "r25955-13330-212695193",
            "commandId": 13330,
            "symbol": "CM_GET_SECTION",
            "label": "Kesit Hattı",
            "large": true,
            "children": [
              {
                "id": "r25955-64791-212695662",
                "commandId": 64791,
                "symbol": "CM_STATIC_SECTION",
                "label": "Kalıp / Temel Planı Kesiti",
                "large": true,
                "children": [],
                "type": "Button"
              }
            ],
            "type": "Button"
          },
          {
            "id": "r25955-separator-212696238",
            "commandId": null,
            "symbol": "",
            "label": "",
            "large": false,
            "children": [],
            "type": "Separator"
          },
          {
            "id": "r25955-28017-212696382",
            "commandId": 28017,
            "symbol": "CM_REBAR_NUMBERING_SETTINGS",
            "label": "Donatı Poz Ayarları",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-28106-212696862",
            "commandId": 28106,
            "symbol": "CM_STEEL_NUMBERING_SETTINGS",
            "label": "Çelik Pozlandırma Ayarları",
            "large": false,
            "children": [],
            "type": "Button"
          },
          {
            "id": "r25955-28004-212697368",
            "commandId": 28004,
            "symbol": "CM_PERFORM_STEEL_NUMBERING",
            "label": "Çelik Pozlandırması yap",
            "large": false,
            "children": [],
            "type": "Button"
          }
        ]
      }
    ]
  }
];

export const NATIVE_HIDDEN_RIBBON_TABS: NativeRibbonTab[] = [
  {
    "id": "HIDDEN",
    "label": "HIDDEN",
    "panels": [
      {
        "id": "r25955-HIDDEN-panel-0",
        "label": "HIDDEN",
        "commands": [
          {
            "id": "r25955-11237-212698627",
            "commandId": 11237,
            "symbol": "CM_MAKE_FILE_COMPATIBLE_WITH_STRUCTURAL_OR_ARCHITECTURAL",
            "label": "TOGGLE",
            "large": true,
            "children": [],
            "type": "Button"
          }
        ]
      }
    ]
  }
];

export const NATIVE_QUICK_ACCESS: NativeRibbonCommand[] = [
  {
    "id": "r25955-14281-212013008",
    "commandId": 14281,
    "symbol": "CM_OPEN_START_PAGE",
    "label": "ideCAD Başlangıç",
    "large": false,
    "children": [],
    "type": "Button"
  },
  {
    "id": "r25955-11290-212013188",
    "commandId": 11290,
    "symbol": "CM_NEW_PROJECT",
    "label": "Yeni Proje",
    "large": false,
    "children": [],
    "type": "Button"
  },
  {
    "id": "r25955-11300-212013364",
    "commandId": 11300,
    "symbol": "CM_OPEN_PROJECT",
    "label": "Proje Aç",
    "large": false,
    "children": [],
    "type": "Button"
  },
  {
    "id": "r25955-11320-212013541",
    "commandId": 11320,
    "symbol": "CM_SAVE_PROJECT",
    "label": "Projeyi Kaydet",
    "large": false,
    "children": [],
    "type": "Button"
  },
  {
    "id": "r25955-11330-212013718",
    "commandId": 11330,
    "symbol": "CM_SAVE_PROJECT_AS",
    "label": "Farklı Kaydet",
    "large": false,
    "children": [],
    "type": "Button"
  },
  {
    "id": "r25955-13600-212013898",
    "commandId": 13600,
    "symbol": "CM_UNDO",
    "label": "Geri Al",
    "large": false,
    "children": [],
    "type": "Button"
  },
  {
    "id": "r25955-13610-212014067",
    "commandId": 13610,
    "symbol": "CM_REDO",
    "label": "İleri Al",
    "large": false,
    "children": [],
    "type": "Button"
  },
  {
    "id": "r25955-11540-212014236",
    "commandId": 11540,
    "symbol": "CM_LOCAL_UNDO",
    "label": "Lokal Undo",
    "large": false,
    "children": [],
    "type": "Button"
  },
  {
    "id": "r25955-0-212014411",
    "commandId": 0,
    "symbol": "Separator",
    "label": "",
    "large": false,
    "children": [],
    "type": "Separator"
  },
  {
    "id": "r25955-11371-212014548",
    "commandId": 11371,
    "symbol": "CM_DRAW_LINE_WEIGHTS",
    "label": "Çizgi Kalınlıklarını Göster",
    "large": false,
    "children": [],
    "type": "Button"
  },
  {
    "id": "r25955-13060-212014730",
    "commandId": 13060,
    "symbol": "CM_LOCAL_PNT",
    "label": "Lokal Nokta Tanımla",
    "large": false,
    "children": [],
    "type": "Button"
  },
  {
    "id": "r25955-13450-212014904",
    "commandId": 13450,
    "symbol": "CM_GET_PERP_REF",
    "label": "Dik Referans",
    "large": false,
    "children": [],
    "type": "Button"
  },
  {
    "id": "r25955-13460-212015081",
    "commandId": 13460,
    "symbol": "CM_GET_PARL_REF",
    "label": "Paralel Referans",
    "large": false,
    "children": [],
    "type": "Button"
  },
  {
    "id": "r25955-11160-212015258",
    "commandId": 11160,
    "symbol": "CM_ORTHO",
    "label": "Dik",
    "large": false,
    "children": [],
    "type": "Button"
  },
  {
    "id": "r25955-0-212015428",
    "commandId": 0,
    "symbol": "Separator",
    "label": "",
    "large": false,
    "children": [],
    "type": "Separator"
  },
  {
    "id": "r25955-11170-212015565",
    "commandId": 11170,
    "symbol": "CM_SNAP",
    "label": "Izgaraya Kilitlen",
    "large": false,
    "children": [],
    "type": "Button"
  },
  {
    "id": "r25955-11350-212015734",
    "commandId": 11350,
    "symbol": "CM_EXTENDED_OBJECT_SNAP",
    "label": "Gelişmiş Yakalama",
    "large": false,
    "children": [],
    "type": "Button"
  },
  {
    "id": "r25955-11340-212015919",
    "commandId": 11340,
    "symbol": "CM_NODE_SNAP",
    "label": "D.N. Kilitlen",
    "large": false,
    "children": [],
    "type": "Button"
  },
  {
    "id": "r25955-11250-212016093",
    "commandId": 11250,
    "symbol": "CM_MIDPOINT_OF",
    "label": "Orta Nokta",
    "large": false,
    "children": [],
    "type": "Button"
  },
  {
    "id": "r25955-11280-212016269",
    "commandId": 11280,
    "symbol": "CM_NEAR_TO",
    "label": "En Yakın Nokta",
    "large": false,
    "children": [],
    "type": "Button"
  },
  {
    "id": "r25955-0-212016441",
    "commandId": 0,
    "symbol": "Separator",
    "label": "",
    "large": false,
    "children": [],
    "type": "Separator"
  },
  {
    "id": "r25955-11380-212016578",
    "commandId": 11380,
    "symbol": "CM_STATIC_MODE",
    "label": "Mimari Plan/Kalıp Planı",
    "large": false,
    "children": [],
    "type": "Button"
  },
  {
    "id": "r25955-11237-212016754",
    "commandId": 11237,
    "symbol": "CM_MAKE_FILE_COMPATIBLE_WITH_STRUCTURAL_OR_ARCHITECTURAL",
    "label": "Mimari/Statik ile Uyumlu Yap",
    "large": false,
    "children": [],
    "type": "Button"
  },
  {
    "id": "r25955-11760-212016972",
    "commandId": 11760,
    "symbol": "CM_COMPLETE_ANALYSIS",
    "label": "Analiz+Tasarım",
    "large": false,
    "children": [],
    "type": "Button"
  }
];

export const NATIVE_MAIN_MENU: NativeRibbonCommand[] = [
  {
    "id": "r25955-14281-211997947",
    "commandId": 14281,
    "symbol": "CM_OPEN_START_PAGE",
    "label": "ideCAD Başlangıç",
    "large": true,
    "children": [],
    "type": "Button"
  },
  {
    "id": "r25955-separator-211998346",
    "commandId": null,
    "symbol": "",
    "label": "",
    "large": false,
    "children": [],
    "type": "Separator"
  },
  {
    "id": "r25955-11290-211998466",
    "commandId": 11290,
    "symbol": "CM_NEW_PROJECT",
    "label": "Yeni",
    "large": true,
    "children": [],
    "type": "Button"
  },
  {
    "id": "r25955-11300-211998842",
    "commandId": 11300,
    "symbol": "CM_OPEN_PROJECT",
    "label": "Aç",
    "large": true,
    "children": [],
    "type": "Button"
  },
  {
    "id": "r25955-11310-211999218",
    "commandId": 11310,
    "symbol": "CM_CLOSE_PROJECT",
    "label": "Kapat",
    "large": true,
    "children": [],
    "type": "Button"
  },
  {
    "id": "r25955-separator-211999597",
    "commandId": null,
    "symbol": "",
    "label": "",
    "large": false,
    "children": [],
    "type": "Separator"
  },
  {
    "id": "r25955-11320-211999717",
    "commandId": 11320,
    "symbol": "CM_SAVE_PROJECT",
    "label": "Kaydet",
    "large": true,
    "children": [],
    "type": "Button"
  },
  {
    "id": "r25955-40226-212000101",
    "commandId": 40226,
    "symbol": "CM_SAVE_PROJECT_COMPRESSED",
    "label": "Sıkıştırarak Kaydet",
    "large": true,
    "children": [],
    "type": "Button"
  },
  {
    "id": "r25955-11330-212000510",
    "commandId": 11330,
    "symbol": "CM_SAVE_PROJECT_AS",
    "label": "Farklı Kaydet",
    "large": true,
    "children": [],
    "type": "Button"
  },
  {
    "id": "r25955-40273-212000900",
    "commandId": 40273,
    "symbol": "CM_SAVE_OLD_VERSION_PROJECT",
    "label": "Eski Versiyon Olarak Kaydet",
    "large": true,
    "children": [],
    "type": "Button"
  },
  {
    "id": "r25955-separator-212001314",
    "commandId": null,
    "symbol": "",
    "label": "",
    "large": false,
    "children": [],
    "type": "Separator"
  },
  {
    "id": "r25955-12099-212001434",
    "commandId": 12099,
    "symbol": "CM_RIBBON_MENU_DUMMY_COMMAND",
    "label": "Import",
    "large": false,
    "children": [
      {
        "id": "r25955-9904-212001789",
        "commandId": 9904,
        "symbol": "CM_IMPORT_DWG",
        "label": "DWG/DXF-2B",
        "large": true,
        "children": [],
        "type": "Button"
      },
      {
        "id": "r25955-9905-212002219",
        "commandId": 9905,
        "symbol": "CM_IMPORT_DWG_AS_STRUCTURE",
        "label": "DWG/DXF (Yapı olarak)",
        "large": true,
        "children": [],
        "type": "Button"
      },
      {
        "id": "r25955-28080-212002675",
        "commandId": 28080,
        "symbol": "CM_IMPORT_IFC",
        "label": "IFC",
        "large": true,
        "children": [],
        "type": "Button"
      }
    ],
    "type": "Button"
  },
  {
    "id": "r25955-12099-212003140",
    "commandId": 12099,
    "symbol": "CM_RIBBON_MENU_DUMMY_COMMAND",
    "label": "Export",
    "large": false,
    "children": [
      {
        "id": "r25955-11920-212003495",
        "commandId": 11920,
        "symbol": "CM_SAP2000_OUTPUT",
        "label": "SAP2000 .s2k",
        "large": true,
        "children": [],
        "type": "Button"
      },
      {
        "id": "r25955-11922-212003932",
        "commandId": 11922,
        "symbol": "CM_EXPORT_TO_CSICOL",
        "label": "CSICOL",
        "large": true,
        "children": [],
        "type": "Button"
      },
      {
        "id": "r25955-11336-212004365",
        "commandId": 11336,
        "symbol": "CM_EXPORT_TO_PDF",
        "label": "PDF",
        "large": true,
        "children": [],
        "type": "Button"
      },
      {
        "id": "r25955-9901-212004792",
        "commandId": 9901,
        "symbol": "CM_EXPORT_DWG",
        "label": "DWG/DXF/DWF",
        "large": true,
        "children": [],
        "type": "Button"
      },
      {
        "id": "r25955-9902-212005223",
        "commandId": 9902,
        "symbol": "CM_EXPORT_FAST_DWG",
        "label": "DWG/DXF/DWF tek",
        "large": true,
        "children": [],
        "type": "Button"
      },
      {
        "id": "r25955-40229-212005663",
        "commandId": 40229,
        "symbol": "CM_SAVE_SCREEN_IMAGE",
        "label": "Ekran Görüntüsü Kaydet",
        "large": true,
        "children": [],
        "type": "Button"
      },
      {
        "id": "r25955-11382-212006117",
        "commandId": 11382,
        "symbol": "CM_EXPORT_OBJ",
        "label": "3D Yazıcı (.OBJ)",
        "large": true,
        "children": [],
        "type": "Button"
      },
      {
        "id": "r25955-28077-212006560",
        "commandId": 28077,
        "symbol": "CM_EXPORT_DUMP",
        "label": "Tekla .dmp",
        "large": true,
        "children": [],
        "type": "Button"
      },
      {
        "id": "r25955-28078-212006992",
        "commandId": 28078,
        "symbol": "CM_EXPORT_IFC",
        "label": "IFC .ifc",
        "large": true,
        "children": [],
        "type": "Button"
      },
      {
        "id": "r25955-11921-212007423",
        "commandId": 11921,
        "symbol": "CM_EXPORT_EXCEL",
        "label": "Excel .xml",
        "large": true,
        "children": [],
        "type": "Button"
      }
    ],
    "type": "Button"
  },
  {
    "id": "r25955-separator-212007895",
    "commandId": null,
    "symbol": "",
    "label": "",
    "large": false,
    "children": [],
    "type": "Separator"
  },
  {
    "id": "r25955-12530-212008015",
    "commandId": 12530,
    "symbol": "CM_EDIT_COPY_TO_FILE",
    "label": "Dosyaya Kopyala",
    "large": true,
    "children": [],
    "type": "Button"
  },
  {
    "id": "r25955-12550-212008408",
    "commandId": 12550,
    "symbol": "CM_EDIT_PASTE_FROM_FILE",
    "label": "Dosyadan Yapıştır",
    "large": true,
    "children": [],
    "type": "Button"
  },
  {
    "id": "r25955-separator-212008809",
    "commandId": null,
    "symbol": "",
    "label": "",
    "large": false,
    "children": [],
    "type": "Separator"
  },
  {
    "id": "r25955-11630-212008929",
    "commandId": 11630,
    "symbol": "CM_NEW_2D_WINDOW",
    "label": "Yeni 2B Penceresi",
    "large": true,
    "children": [],
    "type": "Button"
  },
  {
    "id": "r25955-separator-212009324",
    "commandId": null,
    "symbol": "",
    "label": "",
    "large": false,
    "children": [],
    "type": "Separator"
  },
  {
    "id": "r25955-13170-212009444",
    "commandId": 13170,
    "symbol": "CM_PLOT_DRAWING",
    "label": "Çizdir",
    "large": true,
    "children": [],
    "type": "Button"
  },
  {
    "id": "r25955-separator-212009824",
    "commandId": null,
    "symbol": "",
    "label": "",
    "large": false,
    "children": [],
    "type": "Separator"
  },
  {
    "id": "r25955-14270-212009944",
    "commandId": 14270,
    "symbol": "CM_HELPCONTENTS",
    "label": "Yardım",
    "large": false,
    "children": [
      {
        "id": "r25955-14270-212010287",
        "commandId": 14270,
        "symbol": "CM_HELPCONTENTS",
        "label": "İçerik",
        "large": true,
        "children": [],
        "type": "Button"
      },
      {
        "id": "r25955-40165-212010718",
        "commandId": 40165,
        "symbol": "CM_TIPOFTHEDAY",
        "label": "İpucu",
        "large": true,
        "children": [],
        "type": "Button"
      },
      {
        "id": "r25955-40199-212011146",
        "commandId": 40199,
        "symbol": "CM_CHECK_FOR_UPDATES",
        "label": "Güncelleme var mı?",
        "large": true,
        "children": [],
        "type": "Button"
      },
      {
        "id": "r25955-separator-212011594",
        "commandId": null,
        "symbol": "",
        "label": "",
        "large": false,
        "children": [],
        "type": "Separator"
      },
      {
        "id": "r25955-14280-212011730",
        "commandId": 14280,
        "symbol": "CM_HELPABOUT",
        "label": "ideCAD Statik Hakkında",
        "large": true,
        "children": [],
        "type": "Button"
      }
    ],
    "type": "Button"
  },
  {
    "id": "r25955-separator-212012212",
    "commandId": null,
    "symbol": "",
    "label": "",
    "large": false,
    "children": [],
    "type": "Separator"
  },
  {
    "id": "r25955-57665-212012332",
    "commandId": 57665,
    "symbol": "ID_APP_EXIT",
    "label": "Çıkış",
    "large": true,
    "children": [],
    "type": "Button"
  }
];

export const NATIVE_TAB_ELEMENTS: NativeRibbonCommand[] = [
  {
    "id": "r25955-14290-212017271",
    "commandId": 14290,
    "symbol": "CM_SET_ENTITY_LAYER",
    "label": "Obje Katmanı Değiştir",
    "large": false,
    "children": [],
    "type": "Button"
  },
  {
    "id": "r25955-13130-212017674",
    "commandId": 13130,
    "symbol": "CM_SETTINGS_LAYER",
    "label": "Katman Ayarları",
    "large": false,
    "children": [],
    "type": "Button"
  },
  {
    "id": "r25955-separator-212018066",
    "commandId": null,
    "symbol": "",
    "label": "Görünüm",
    "large": false,
    "children": [
      {
        "id": "r25955-3021-212018501",
        "commandId": 3021,
        "symbol": "CM_VIEW_APPLOOK_WIN_2000",
        "label": "Windows 2000",
        "large": false,
        "children": [],
        "type": "Button"
      },
      {
        "id": "r25955-3022-212019078",
        "commandId": 3022,
        "symbol": "CM_VIEW_APPLOOK_OFF_XP",
        "label": "Office XP",
        "large": false,
        "children": [],
        "type": "Button"
      },
      {
        "id": "r25955-3023-212019650",
        "commandId": 3023,
        "symbol": "CM_VIEW_APPLOOK_WIN_XP",
        "label": "Windows XP",
        "large": false,
        "children": [],
        "type": "Button"
      },
      {
        "id": "r25955-3024-212020223",
        "commandId": 3024,
        "symbol": "CM_VIEW_APPLOOK_OFF_2003",
        "label": "Office 2003",
        "large": false,
        "children": [],
        "type": "Button"
      },
      {
        "id": "r25955-3025-212020799",
        "commandId": 3025,
        "symbol": "CM_VIEW_APPLOOK_VS_2005",
        "label": "Visual Studio 2005",
        "large": false,
        "children": [],
        "type": "Button"
      },
      {
        "id": "r25955-3030-212021381",
        "commandId": 3030,
        "symbol": "CM_VIEW_APPLOOK_VS_2008",
        "label": "Visual Studio 2008",
        "large": false,
        "children": [],
        "type": "Button"
      },
      {
        "id": "r25955-3026-212021963",
        "commandId": 3026,
        "symbol": "CM_VIEW_APPLOOK_OFF_2007_BLUE",
        "label": "Office 2007 (Blue Style)",
        "large": false,
        "children": [],
        "type": "Button"
      },
      {
        "id": "r25955-3027-212022562",
        "commandId": 3027,
        "symbol": "CM_VIEW_APPLOOK_OFF_2007_BLACK",
        "label": "Office 2007 (Black Style)",
        "large": false,
        "children": [],
        "type": "Button"
      },
      {
        "id": "r25955-3028-212023163",
        "commandId": 3028,
        "symbol": "CM_VIEW_APPLOOK_OFF_2007_SILVER",
        "label": "Office 2007 (Silver Style)",
        "large": false,
        "children": [],
        "type": "Button"
      },
      {
        "id": "r25955-3029-212023766",
        "commandId": 3029,
        "symbol": "CM_VIEW_APPLOOK_OFF_2007_AQUA",
        "label": "Office 2007 (Aqua Style)",
        "large": false,
        "children": [],
        "type": "Button"
      },
      {
        "id": "r25955-3031-212024365",
        "commandId": 3031,
        "symbol": "CM_VIEW_APPLOOK_WINDOWS_7",
        "label": "Windows 7",
        "large": false,
        "children": [],
        "type": "Button"
      }
    ],
    "type": "Button"
  },
  {
    "id": "r25955-12600-212024985",
    "commandId": 12600,
    "symbol": "CM_PREFERENCES",
    "label": "Genel Ayarlar",
    "large": true,
    "children": [],
    "type": "Button"
  },
  {
    "id": "r25955-separator-212025523",
    "commandId": null,
    "symbol": "",
    "label": "",
    "large": false,
    "children": [],
    "type": "Separator"
  },
  {
    "id": "r25955-14270-212025644",
    "commandId": 14270,
    "symbol": "CM_HELPCONTENTS",
    "label": "Yardım",
    "large": false,
    "children": [
      {
        "id": "r25955-14270-212025987",
        "commandId": 14270,
        "symbol": "CM_HELPCONTENTS",
        "label": "İçerik",
        "large": true,
        "children": [],
        "type": "Button"
      },
      {
        "id": "r25955-40165-212026418",
        "commandId": 40165,
        "symbol": "CM_TIPOFTHEDAY",
        "label": "İpucu",
        "large": true,
        "children": [],
        "type": "Button"
      },
      {
        "id": "r25955-40199-212026846",
        "commandId": 40199,
        "symbol": "CM_CHECK_FOR_UPDATES",
        "label": "Güncelleme var mı?",
        "large": true,
        "children": [],
        "type": "Button"
      },
      {
        "id": "r25955-separator-212027294",
        "commandId": null,
        "symbol": "",
        "label": "",
        "large": false,
        "children": [],
        "type": "Separator"
      },
      {
        "id": "r25955-14280-212027430",
        "commandId": 14280,
        "symbol": "CM_HELPABOUT",
        "label": "ideCAD Statik Hakkında",
        "large": true,
        "children": [],
        "type": "Button"
      }
    ],
    "type": "Button"
  }
];
