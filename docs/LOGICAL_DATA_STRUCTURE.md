# Logical Data Structure (Input & Output) | Portal MOKA

## Legenda Notasi

| Simbol | Arti |
|---|---|
| `=` | Terdiri dari (*is composed of*) |
| `+` | Dan (*sequence / concatenation*) |
| `( ... )` | Elemen opsional (*0 atau 1 kemunculan*) |
| `[ A , B ]` | Pilihan (*selection / salah satu dari*) |
| `1 { ... } n` | Pengulangan minimal 1 hingga *n* kali (*1 to n*) |
| `0 { ... } n` | Pengulangan 0 hingga *n* kali (*0 to n*) |
| `NAME >` | Referensi ke sub-struktur yang didefinisikan terpisah |

---

## 1. Logical Data Structure: INPUT

```text
INPUT_LOGIN                 =   ( EMAIL )
                            +   ( PASSWORD )
                            +   ( REMEMBER_ME )
                            +   ( [ participant , committee ] )

INPUT_REGISTER              =   ( FULL_NAME )
                            +   ( EMAIL )
                            +   ( PASSWORD )
                            +   ( CONFIRM_PASSWORD )
                            +   CONSENT_AGREEMENT

INPUT_FORMULIR_PESERTA      =   FULL_NAME
                            +   PHONE_NUMBER
                            +   CATEGORY = [ Mojang , Jajaka ]
                            +   BIRTH_DATE
                            +   HEIGHT_CM
                            +   WEIGHT_KG
                            +   EDUCATION_ACTIVITY
                            +   DISTRICT
                            +   ADDRESS
                            +   ELIGIBILITY_CHECK

INPUT_UPLOAD_DOKUMEN        =   DOCUMENT_KIND = [ portrait , fullBody , closeUp , identity , cv , certificate ]
                            +   FILE_UPLOAD >

INPUT_KIRIM_PENDAFTARAN     =   APPLICATION_ID
                            +   DECLARATION_CHECK

INPUT_FOTO_PROFIL           =   FILE_UPLOAD >

INPUT_TINJAU_DOKUMEN        =   DOCUMENT_ID
                            +   REVIEW_STATUS = received

INPUT_KEPUTUSAN_ADMIN       =   APPLICATION_ID
                            +   DECISION_STATUS = [ accepted , rejected ]
                            +   CONFIRM_REQUIREMENTS
                            +   ( REVIEW_NOTE )

INPUT_JADWAL_INTERVIEW      =   ( INTERVIEW_ID )
                            +   INTERVIEW_DATE_WIB
                            +   INTERVIEW_LOCATION
                            +   ( MEETING_LINK )
                            +   ( INTERVIEW_NOTE )
                            +   PUBLISH_ACTION = [ draft , published , cancelled ]

INPUT_PENGATURAN_WAKTU      =   ( REGISTRATION_DEADLINE_WIB )
                            +   ( SELECTION_RELEASE_AT_WIB )

INPUT_PENGATURAN_TEMA       =   PRESET_ID
                            +   BRAND_HEX
                            +   COCOA_HEX
                            +   CANVAS_HEX
                            +   PAPER_HEX
                            +   ACCENT_HEX
                            +   LOGO_IMAGE_URL
                            +   COVER_IMAGE_URL
                            +   EVENT_YEAR
                            +   ( REGISTRATION_NOTE )
```

---

## 2. Logical Data Structure: OUTPUT

```text
OUTPUT_AUTENTIKASI          =   USER >

OUTPUT_WORKSPACE_PESERTA    =   USER >
                            +   ( APPLICATION > )
                            +   0 { DOCUMENT > } n
                            +   0 { PROFILE_PHOTO > } n
                            +   0 { REVIEW_HISTORY > } n
                            +   0 { INTERVIEW > } n
                            +   SETTING >
                            +   TOTAL_APPLICATIONS
                            +   SERVER_TIME

OUTPUT_WORKSPACE_PANITIA    =   USER >
                            +   0 { APPLICATION > } n
                            +   0 { DOCUMENT > } n
                            +   0 { PROFILE_PHOTO > } n
                            +   0 { REVIEW_HISTORY > } n
                            +   0 { INTERVIEW > } n
                            +   SETTING >
                            +   TOTAL_APPLICATIONS
                            +   SERVER_TIME

OUTPUT_HASIL_SELEKSI        =   PASSED_FLAG = [ true , false ]
                            +   FULL_NAME
                            +   CATEGORY = [ Mojang , Jajaka ]
                            +   RELEASED_AT
                            +   0 { INTERVIEW > } n

OUTPUT_PRATINJAU_DOKUMEN    =   DOCUMENT >
                            +   VIEW_MODE = [ inline , modal , fullscreen ]
                            +   ( ZOOM_PERCENT )
                            +   ( DOWNLOAD_URL )

OUTPUT_TEMPLATE_UNDUHAN     =   1 { TEMPLATE_ITEM = ( TEMPLATE_KEY + TEMPLATE_NAME + TEMPLATE_URL ) } n
```

---

## 3. Definisi Sub-Struktur Entitas (`>`)

```text
USER                        =   USER_ID
                            +   NAME
                            +   EMAIL
                            +   ROLE = [ participant , committee ]

APPLICATION                 =   APPLICATION_ID
                            +   OWNER = USER_ID
                            +   ( FULL_NAME )
                            +   ( PHONE_NUMBER )
                            +   ( CATEGORY = [ Mojang , Jajaka ] )
                            +   ( BIRTH_DATE )
                            +   ( HEIGHT_CM )
                            +   ( WEIGHT_KG )
                            +   ( EDUCATION_ACTIVITY )
                            +   ( DISTRICT )
                            +   ( ADDRESS )
                            +   ( ELIGIBILITY_CHECK )
                            +   STATUS = [ draft , pending , accepted , rejected ]
                            +   ( REVIEW_NOTE )
                            +   ( PASSED_FLAG = [ true , false ] )
                            +   ( RESULT_PUBLISHED )
                            +   ( SUBMITTED_AT )
                            +   ( REQUIREMENTS_CONFIRMED )
                            +   ( DECIDED_BY_NAME )
                            +   ( DECIDED_AT )
                            +   CREATED_AT
                            +   UPDATED_AT

DOCUMENT                    =   DOCUMENT_ID
                            +   OWNER = USER_ID
                            +   KIND = [ portrait , fullBody , closeUp , identity , cv , certificate ]
                            +   ( ORIGINAL_NAME )
                            +   ( FILENAME )
                            +   ( MIME_TYPE )
                            +   ( FILE_SIZE_BYTES )
                            +   ( FILE_URL )
                            +   REVIEW_STATUS = [ uploaded , received ]
                            +   ( REVIEWED_BY_NAME )
                            +   ( REVIEWED_AT )
                            +   CREATED_AT
                            +   UPDATED_AT

FILE_UPLOAD                 =   FILE_NAME
                            +   MIME_TYPE
                            +   FILE_SIZE_BYTES
                            +   FILE_CONTENT_BLOB_OR_DATA_URL

INTERVIEW                   =   INTERVIEW_ID
                            +   INTERVIEW_DATE
                            +   INTERVIEW_LOCATION
                            +   ( MEETING_LINK )
                            +   ( INTERVIEW_NOTE )
                            +   STATUS = [ draft , published , cancelled ]
                            +   CREATED_AT
                            +   UPDATED_AT

PROFILE_PHOTO               =   PHOTO_ID
                            +   OWNER = USER_ID
                            +   PHOTO_URL
                            +   ( FILENAME )
                            +   ( MIME_TYPE )
                            +   ( FILE_SIZE_BYTES )
                            +   CREATED_AT
                            +   UPDATED_AT

REVIEW_HISTORY              =   HISTORY_ID
                            +   OWNER = USER_ID
                            +   ACTION = [ document-upload , document-review , administrative-decision ]
                            +   ( DOCUMENT_ID )
                            +   ( APPLICATION_ID )
                            +   ( DOCUMENT_KIND )
                            +   ( RESULT )
                            +   ( NOTE )
                            +   ( FILENAME )
                            +   ( ACTOR_NAME )
                            +   RECORDED_AT
                            +   CREATED_AT
                            +   UPDATED_AT

SETTING                     =   SETTING_ID
                            +   ( REGISTRATION_NOTE )
                            +   ( PARENT_PERMISSION_TEMPLATE_URL )
                            +   ( REGISTRATION_FORM_TEMPLATE_URL )
                            +   ( CV_TEMPLATE_URL )
                            +   ( REGISTRATION_DEADLINE )
                            +   ( SELECTION_RELEASE_AT )
                            +   ( EVENT_YEAR )
                            +   ( THEME_PREFERENCES > )
                            +   ( UPDATED_AT )

THEME_PREFERENCES           =   PRESET_ID
                            +   BRAND_HEX
                            +   COCOA_HEX
                            +   CANVAS_HEX
                            +   PAPER_HEX
                            +   ACCENT_HEX
                            +   LOGO_URL
                            +   COVER_URL
                            +   EVENT_YEAR
```
