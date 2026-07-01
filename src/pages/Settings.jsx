import { useState } from 'react'
import {
  ArrowRight, Banknote, Bell, Building2, ChevronLeft, CircleDollarSign, ContactRound, Languages,
  MoonStar, Palette, Pencil, RotateCcw, ShieldCheck, SunMedium, Tag, UserRound, WalletCards,
  LockKeyhole, Plus, Info, Trash2, Sparkles, Target, Code2,
} from 'lucide-react'
import ContactCard from '../components/settings/ContactCard'
import SimpleManager from '../components/settings/SimpleManager'
import { BankCatalogList, BankQuickAddModal } from '../components/BankPicker'
import { BottomSheetSelect } from '../components/FormControls'
import { Field, FormActions, ManageRow, Modal, PageHeader } from '../components/UI'
import { createBankRecord, getBankIcon } from '../constants/banks'
import { ACCENT_OPTIONS, CONTACT_TYPES, CURRENCY_OPTIONS, SETTINGS_ENTITY_TITLES, THEME_OPTIONS } from '../constants/settings'
import { contactDetails } from '../helpers/contacts'
import { convertFinanceData } from '../helpers/currency'
import { isDeletedHistoryItem } from '../helpers/records'
import { useSettings } from '../hooks/useSettings'
import { DIGIT_STYLES, LANGUAGES } from '../i18n/translations'
import { useI18n } from '../i18n/I18nContext'
import { hashPasscode } from '../hooks/useAppLock'
import { APP_LOGO_PATH, APP_NAME, APP_NAME_FA, APP_VERSION } from '../config/app'

export default function Settings({ data, updateData, navigate, onReset }) {
  const { t } = useI18n()
  const settings = useSettings(data, updateData)
  const [currencyChange, setCurrencyChange] = useState(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [profile, setProfile] = useState(data.profile)
  const selectCurrency = next => {
    const current = data.currency || 'تومان'
    if (next === current) return
    if ([current, next].every(value => ['تومان', 'ریال'].includes(value))) setCurrencyChange({ from: current, to: next })
    else updateData(previous => ({ ...previous, currency: next }))
  }
  const confirmCurrency = () => {
    updateData(previous => convertFinanceData(previous, currencyChange.from, currencyChange.to))
    setCurrencyChange(null)
  }
  const saveProfile = event => {
    event.preventDefault()
    updateData(previous => ({ ...previous, profile }))
    setProfileOpen(false)
  }

  return <div className="page settings-page">
    {settings.tab === 'overview' ? <SettingsOverview data={data} settings={settings} onTrash={() => navigate?.('trash', 'all')} onProfile={() => { setProfile(data.profile); setProfileOpen(true) }} />
      : <SettingsSubPage settings={settings} data={data} onBack={() => settings.setTab('overview')}>
        {settings.tab === 'ظاهر برنامه' && <AppearanceSection data={data} updateData={updateData}/>}
        {settings.tab === 'مخاطبین مالی' && <ContactsSection settings={settings}/>}
        {settings.tab === 'بانک‌ها' && <BanksSection rows={data.banks} updateData={updateData} onAdd={settings.openEditor} onDelete={settings.remove}/>}
        {settings.tab === 'دسته‌بندی‌ها' && <><SimpleManager title="دسته‌بندی هزینه" type="expenseCategories" rows={data.expenseCategories} onAdd={settings.openEditor} onDelete={settings.remove}/><SimpleManager title="دسته‌بندی درآمد" type="incomeCategories" rows={data.incomeCategories} onAdd={settings.openEditor} onDelete={settings.remove}/></>}
        {settings.tab === 'تگ‌ها' && <SimpleManager title="مدیریت تگ‌ها" type="tags" rows={data.tags} onAdd={settings.openEditor} onDelete={settings.remove}/>}
        {settings.tab === 'واحد پول' && <CurrencySection value={data.currency || 'تومان'} onChange={selectCurrency}/>}
        {settings.tab === 'زبان برنامه' && <ChoiceSection title="زبان برنامه" subtitle="زبان و جهت نمایش رابط کاربری" options={LANGUAGES} value={data.language || 'fa'} onChange={language => updateData(previous => ({ ...previous, language }))}/>}
        {settings.tab === 'نمایش اعداد' && <ChoiceSection title="نمایش اعداد" subtitle="شیوه نمایش ارقام در برنامه" options={DIGIT_STYLES} value={data.digitStyle || 'en'} onChange={digitStyle => updateData(previous => ({ ...previous, digitStyle }))}/>}
        {settings.tab === 'داده و حریم خصوصی' && <LocalDataNotice onReset={onReset}/>}
        {settings.tab === 'قفل برنامه' && <AppLockSection data={data} updateData={updateData}/>}
        {settings.tab === 'اعلان‌ها' && <NotificationSettings data={data} updateData={updateData}/>}
        {settings.tab === 'درباره میرزا' && <AboutMirzaPage/>}
      </SettingsSubPage>}
    <SettingsEditor data={data} settings={settings}/>
    <ContactDetail detail={settings.detail} onClose={() => settings.setDetail(null)}/>
    <ProfileEditor open={profileOpen} profile={profile} setProfile={setProfile} onSave={saveProfile} onClose={() => setProfileOpen(false)}/>
    <Modal open={!!currencyChange} title="تبدیل واحد پول" onClose={() => setCurrencyChange(null)}>
      <div className="confirm-content"><CircleDollarSign/><p>با تأیید این تغییر، تمام مبالغ موجود به‌صورت خودکار از {currencyChange?.from} به {currencyChange?.to} تبدیل می‌شوند.</p>
        <div className="form-actions"><button className="secondary-btn" onClick={() => setCurrencyChange(null)}>{t('لغو')}</button><button className="primary-btn" onClick={confirmCurrency}>{t('تأیید تبدیل')}</button></div>
      </div>
    </Modal>
  </div>
}

function SettingsOverview({ data, settings, onTrash, onProfile }) {
  const deletedCount = (data.histories || []).filter(isDeletedHistoryItem).length
  return <>
    <PageHeader eyebrow="شخصی‌سازی و داده‌ها" title="تنظیمات" subtitle="مدیریت حساب، ظاهر و اطلاعات پایه"/>
    <button className="profile-card" onClick={onProfile}>
      <div className="profile-avatar">{data.profile?.name?.slice(0, 1) || 'ک'}</div>
      <div><strong>{data.profile?.name || 'کاربر میرزا'}</strong><span>{data.profile?.role || 'میرزا'}</span></div>
      <span className="profile-edit"><Pencil size={15}/></span>
    </button>
    <SettingsGroup title="حساب و شخصی‌سازی">
      <SettingsRow icon={UserRound} title="پروفایل کاربری" subtitle="نام، اطلاعات تماس و معرفی کوتاه" onClick={onProfile}/>
      <SettingsRow icon={Palette} title="ظاهر برنامه" subtitle={`${themeLabel(data.theme)} • ${accentLabel(data.accent)}`} onClick={() => settings.setTab('ظاهر برنامه')}/>
      <SettingsRow icon={WalletCards} title="واحد پول" subtitle={data.currency || 'تومان'} onClick={() => settings.setTab('واحد پول')}/>
      <SettingsRow icon={Languages} title="زبان برنامه" subtitle={LANGUAGES.find(item => item.code === (data.language || 'fa'))?.label} onClick={() => settings.setTab('زبان برنامه')}/>
      <SettingsRow icon={Bell} title="نمایش اعداد" subtitle={DIGIT_STYLES.find(item => item.code === (data.digitStyle || 'en'))?.label} onClick={() => settings.setTab('نمایش اعداد')}/>
      <SettingsRow icon={LockKeyhole} title="قفل برنامه" subtitle={data.lockSettings?.enabled ? 'فعال' : 'غیرفعال'} onClick={() => settings.setTab('قفل برنامه')}/>
      <SettingsRow icon={Bell} title="اعلان‌ها" subtitle={data.notificationSettings?.enabled ? 'فعال' : 'فقط داخل برنامه'} onClick={() => settings.setTab('اعلان‌ها')}/>
    </SettingsGroup>
    <SettingsGroup title="مالی و اطلاعات پایه">
      <SettingsRow icon={ContactRound} title="مخاطبین مالی" subtitle={`${data.financialContacts.length} مخاطب ثبت‌شده`} onClick={() => settings.setTab('مخاطبین مالی')}/>
      <SettingsRow icon={Building2} title="مدیریت بانک‌ها" subtitle={`${data.banks.length} بانک`} onClick={() => settings.setTab('بانک‌ها')}/>
      <SettingsRow icon={Banknote} title="مدیریت دسته‌بندی‌ها" subtitle="هزینه‌ها و درآمدها" onClick={() => settings.setTab('دسته‌بندی‌ها')}/>
      <SettingsRow icon={Tag} title="مدیریت تگ‌ها" subtitle={`${data.tags.length} تگ فعال`} onClick={() => settings.setTab('تگ‌ها')}/>
    </SettingsGroup>
    <SettingsGroup title="اطلاعات، امنیت و درباره برنامه">
      <SettingsRow icon={Trash2} title="موارد حذف‌شده" subtitle={`${deletedCount} مورد در سطل حذف‌شده‌ها`} onClick={onTrash}/>
      <SettingsRow icon={ShieldCheck} title="داده و حریم خصوصی" subtitle="ذخیره محلی و بازنشانی اطلاعات" onClick={() => settings.setTab('داده و حریم خصوصی')}/>
      <SettingsRow icon={Info} title="درباره میرزا" subtitle="نسخه، امکانات و اطلاعات توسعه‌دهنده" onClick={() => settings.setTab('درباره میرزا')}/>
    </SettingsGroup>
    <p className="settings-version settings-credit">طراحی و توسعه ؛ «علی مقدم»</p>
    <p className="settings-version">{APP_NAME_FA} • نسخه {APP_VERSION}</p>
  </>
}

function SettingsGroup({ title, children }) { return <section className="settings-group"><h2>{title}</h2><div>{children}</div></section> }
function SettingsRow({ icon: Icon, title, subtitle, onClick }) { return <button className="settings-row" onClick={onClick}><span className="settings-row-icon"><Icon size={19}/></span><span><strong>{title}</strong><small>{subtitle}</small></span><ChevronLeft size={18}/></button> }
function SettingsSubPage({ settings, data, onBack, children }) {
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const meta = settingsHeaderMeta(settings.tab, data)
  const handleAdd = () => {
    if (meta.addOptions) setAddMenuOpen(true)
    else if (meta.addType) settings.openEditor(meta.addType)
  }
  return <><header className="settings-subhead">
    <button onClick={onBack} aria-label="بازگشت"><ArrowRight size={20}/></button>
    <div><h1>{meta.title}</h1>{meta.subtitle && <p>{meta.subtitle}</p>}</div>
    {(meta.addType || meta.addOptions) && <button className="add-btn" aria-label="افزودن" onClick={handleAdd}><Plus size={20}/></button>}
  </header>{children}
    <Modal open={addMenuOpen} title="افزودن دسته‌بندی" onClose={() => setAddMenuOpen(false)}>
      <div className="add-action-menu">{meta.addOptions?.map(option => <button key={option.type} type="button" onClick={() => { settings.openEditor(option.type); setAddMenuOpen(false) }}>{option.label}</button>)}</div>
    </Modal>
  </>
}
function settingsHeaderMeta(tab, data) {
  const meta = {
    'ظاهر برنامه': { title: 'ظاهر برنامه', subtitle: 'حالت نمایش و رنگ اصلی رابط' },
    'مخاطبین مالی': { title: 'مخاطبین مالی', subtitle: 'اطلاعات حساس به‌صورت پیش‌فرض پنهان است', addType: 'financialContacts' },
    'بانک‌ها': { title: 'مدیریت بانک‌ها', subtitle: `${data.banks.length} بانک ثبت‌شده`, addType: 'banks' },
    'دسته‌بندی‌ها': { title: 'مدیریت دسته‌بندی‌ها', subtitle: 'دسته‌بندی هزینه‌ها و درآمدها', addOptions: [{ label: 'دسته‌بندی هزینه', type: 'expenseCategories' }, { label: 'دسته‌بندی درآمد', type: 'incomeCategories' }] },
    'تگ‌ها': { title: 'مدیریت تگ‌ها', subtitle: `${data.tags.length} تگ فعال`, addType: 'tags' },
    'واحد پول': { title: 'واحد پول', subtitle: 'واحد نمایش همه مبالغ برنامه' },
    'زبان برنامه': { title: 'زبان برنامه', subtitle: 'زبان و جهت نمایش رابط کاربری' },
    'نمایش اعداد': { title: 'نمایش اعداد', subtitle: 'شیوه نمایش ارقام در برنامه' },
    'داده و حریم خصوصی': { title: 'داده و حریم خصوصی', subtitle: 'ذخیره محلی و بازنشانی اطلاعات' },
    'قفل برنامه': { title: 'قفل برنامه', subtitle: 'رمز ورود و قفل خودکار' },
    'اعلان‌ها': { title: 'اعلان‌ها', subtitle: 'اعلان بدهی‌های عقب‌افتاده' },
    'درباره میرزا': { title: 'درباره میرزا', subtitle: 'اطلاعات برنامه و تیم توسعه' },
  }
  return meta[tab] || { title: tab, subtitle: '' }
}
const themeLabel = value => ({ light: 'تم روشن', dark: 'تم تیره', system: 'هماهنگ با سیستم' }[value || 'light'])
const validAccent = value => ['mint', 'rose', 'lavender'].includes(value) ? value : 'mint'
const accentLabel = value => ACCENT_OPTIONS.find(item => item.code === validAccent(value))?.label
const FONT_SIZE_OPTIONS = [
  { code: 'normal', label: 'نرمال', description: 'اندازه پایه برنامه' },
  { code: 'large', label: 'متوسط', description: '۱۰٪ درشت‌تر از نرمال' },
  { code: 'xlarge', label: 'درشت', description: '۲۰٪ درشت‌تر از نرمال' },
]

function AppearanceSection({ data, updateData }) {
  const fontIndex = Math.max(0, FONT_SIZE_OPTIONS.findIndex(item => item.code === (data.fontSize || 'normal')))
  const changeFontSize = event => {
    const option = FONT_SIZE_OPTIONS[Number(event.target.value)] || FONT_SIZE_OPTIONS[0]
    updateData(previous => ({ ...previous, fontSize: option.code }))
  }
  return <section className="appearance-section">
    <h3>حالت نمایش</h3><div className="theme-options">{THEME_OPTIONS.map(({ code, label, description }) => <button key={code} className={(data.theme || 'light') === code ? 'active' : ''} onClick={() => updateData(previous => ({ ...previous, theme: code }))}><span>{code === 'light' ? <SunMedium/> : code === 'dark' ? <MoonStar/> : <Palette/>}</span><strong>{label}</strong><small>{description}</small><i>{(data.theme || 'light') === code ? '✓' : ''}</i></button>)}</div>
    <h3>تم رنگی</h3>
    <div className="accent-options" role="radiogroup" aria-label="انتخاب تم رنگی">
      {ACCENT_OPTIONS.map(option => {
        const active = validAccent(data.accent) === option.code
        return <button key={option.code} type="button" role="radio" aria-checked={active} className={active ? 'active' : ''} onClick={() => updateData(previous => ({ ...previous, accent: option.code }))}>
          <span className="theme-swatch-card" style={{ '--preview-primary': option.primary, '--preview-secondary': option.secondary, '--preview-accent': option.accent, '--preview-surface': option.surface }}>
            <i className="theme-swatch-primary"/>
            <i className="theme-swatch-secondary"/>
            <i className="theme-swatch-accent"/>
          </span>
          <strong>{option.label}</strong>
        </button>
      })}
    </div>
    <h3>اندازه فونت</h3>
    <div className="font-size-control">
      <div className="font-size-head"><strong>{FONT_SIZE_OPTIONS[fontIndex]?.label}</strong><span>{FONT_SIZE_OPTIONS[fontIndex]?.description}</span></div>
      <input type="range" min="0" max="2" step="1" value={fontIndex} onChange={changeFontSize} aria-label="اندازه فونت"/>
      <div className="font-size-labels">{FONT_SIZE_OPTIONS.map(option => <span key={option.code}>{option.label}</span>)}</div>
    </div>
    <div className="theme-preview"><span>پیش‌نمایش رابط</span><strong>رنگ و تم انتخابی بلافاصله در کل برنامه اعمال می‌شود.</strong><button>دکمه اصلی</button></div>
  </section>
}

function ProfileEditor({ open, profile, setProfile, onSave, onClose }) {
  const change = name => event => setProfile({ ...profile, [name]: event.target.value })
  return <Modal open={open} title="ویرایش پروفایل" onClose={onClose}>{profile && <form className="form-grid" onSubmit={onSave}><div className="profile-editor-avatar">{profile.name?.slice(0,1) || 'ک'}</div><Field label="نام و نام خانوادگی" value={profile.name} onChange={change('name')}/><Field label="عنوان یا نقش" value={profile.role} onChange={change('role')}/><Field label="شماره موبایل، اختیاری" value={profile.mobile} onChange={change('mobile')}/><Field label="ایمیل، اختیاری" value={profile.email} onChange={change('email')}/><Field label="معرفی کوتاه" type="textarea" value={profile.bio} onChange={change('bio')}/><FormActions onCancel={onClose}/></form>}</Modal>
}

function ChoiceSection({ title, subtitle, options, value, onChange }) {
  return <section className="settings-section choice-section"><div className="choice-options">{options.map(option => <button key={option.code} className={value === option.code ? 'active' : ''} onClick={() => onChange(option.code)}><strong>{option.label}</strong><i>{value === option.code ? '✓' : ''}</i></button>)}</div></section>
}
function CurrencySection({ value, onChange }) { return <section className="settings-section currency-section"><div className="currency-options">{CURRENCY_OPTIONS.map(option => <button key={option} className={value === option ? 'active' : ''} onClick={() => onChange(option)}><span>{option === 'یورو' ? '€' : option === 'دلار' ? '$' : option}</span><strong>{option}</strong></button>)}</div><p className="settings-note">تبدیل خودکار مبلغ فقط بین تومان و ریال انجام می‌شود.</p></section> }
function ContactsSection({ settings }) { return <section className="settings-section"><div className="contact-list">{settings.contacts.map(contact => <ContactCard key={contact.id} contact={contact} onDetail={() => settings.setDetail(contact)} onEdit={() => settings.openEditor('financialContacts', contact)} onDelete={() => settings.remove('financialContacts', contact.id)}/>)}</div></section> }
function BanksSection({ rows, onAdd, onDelete }) {
  return <section className="settings-section">
    <div className="manage-list">{rows.map(item => <ManageRow key={item.id} icon={getBankIcon(item.title) || item.icon} title={item.title} meta={item.hasCheckbook ? 'دسته چک فعال' : 'بدون دسته چک'} onEdit={() => onAdd('banks', item)} onDelete={() => onDelete('banks', item.id)} />)}</div>
  </section>
}
function SettingsEditor({ data, settings }) {
  const [openSelect, setOpenSelect] = useState(null)
  const [bankModalOpen, setBankModalOpen] = useState(false)
  const change = name => event => settings.setEditing({ ...settings.editing, [name]: event.target.value })
  const setValue = (name, value) => settings.setEditing({ ...settings.editing, [name]: value })
  const addBank = bank => {
    settings.updateData?.(current => current.banks.some(item => item.title === bank.title)
      ? current
      : { ...current, banks: [bank, ...current.banks] })
    setBankModalOpen(false)
  }
  const toggleCatalogBank = (title, active) => settings.updateData?.(current => {
    const exists = current.banks.some(bank => bank.title === title)
    if (active && !exists) return { ...current, banks: [createBankRecord(title), ...current.banks] }
    if (!active) return { ...current, banks: current.banks.filter(bank => bank.title !== title) }
    return current
  })
  const changeCatalogCheckbook = (title, hasCheckbook) => settings.updateData?.(current => ({
    ...current,
    banks: current.banks.map(bank => bank.title === title ? { ...bank, hasCheckbook, icon: bank.icon || getBankIcon(title), updatedAt: new Date().toISOString() } : bank),
  }))
  if (settings.editType === 'banks' && settings.editing) {
    return <Modal open={!!settings.editing} title="مدیریت بانک‌ها" onClose={settings.closeEditor}>
      <BankCatalogList banks={data.banks || []} onToggle={toggleCatalogBank} onCheckbookChange={changeCatalogCheckbook}/>
      <div className="form-actions"><button type="button" className="primary-btn" onClick={settings.closeEditor}>انجام شد</button></div>
    </Modal>
  }
  return <Modal open={!!settings.editing} title={`${settings.editing?.id ? 'ویرایش' : 'افزودن'} ${SETTINGS_ENTITY_TITLES[settings.editType] || 'مخاطب مالی'}`} onClose={settings.closeEditor}>
    {settings.editing && <form onSubmit={settings.save} className="form-grid">
      {settings.editType === 'financialContacts' ? <>
        <Field label="نام شخص / سازمان" value={settings.editing.title} onChange={change('title')}/>
        <label className="field titled-info-field">
          <span>عنوان <Info size={15} aria-label="راهنمای عنوان" /></span>
          <input value={settings.editing.relationTitle || ''} onChange={change('relationTitle')} />
          <small className="field-hint">در این فیلد می‌توانید نسبت، شرکت یا عنوانی دلخواه برای یادآوری بهتر این مخاطب وارد کنید.</small>
        </label>
        <BottomSheetSelect label="نوع مخاطب" value={settings.editing.type} options={CONTACT_TYPES} onChange={value => setValue('type', value)}
          open={openSelect === 'type'} onOpen={() => setOpenSelect('type')} onClose={() => setOpenSelect(null)}/>
        <Field label="شماره موبایل، اختیاری" value={settings.editing.mobile} onChange={change('mobile')}/>
        <ContactBankAccounts editing={settings.editing} setEditing={settings.setEditing} banks={data.banks} openSelect={openSelect} setOpenSelect={setOpenSelect} onAddBank={() => setBankModalOpen(true)}/>
        {[['کد ملی','nationalId'],['توضیحات','description']].map(([label, name]) =>
          <Field key={name} label={label} type={name === 'description' ? 'textarea' : 'text'} value={settings.editing[name]} onChange={change(name)}/>)}
      </> : <Field label="عنوان" value={settings.editing.title} onChange={change('title')}/>}
      <FormActions onCancel={settings.closeEditor}/>
    </form>}
    <Modal open={bankModalOpen} title="افزودن بانک" onClose={() => setBankModalOpen(false)}>
      <BankQuickAddModal banks={data.banks || []} onClose={() => setBankModalOpen(false)} onAdd={addBank}/>
    </Modal>
  </Modal>
}
function ContactBankAccounts({ editing, setEditing, banks, openSelect, setOpenSelect, onAddBank }) {
  const accounts = editing.bankAccounts?.length ? editing.bankAccounts : [{ id: 'primary', bank: '', account: '', card: '', iban: '' }]
  const updateAccount = (id, patch) => setEditing({ ...editing, bankAccounts: accounts.map(item => item.id === id ? { ...item, ...patch } : item) })
  const addAccount = () => setEditing({ ...editing, bankAccounts: [...accounts, { id: crypto.randomUUID(), bank: '', account: '', card: '', iban: '' }] })
  const removeAccount = id => setEditing({ ...editing, bankAccounts: accounts.length > 1 ? accounts.filter(item => item.id !== id) : accounts.map(item => item.id === id ? { ...item, bank: '', account: '', card: '', iban: '' } : item) })
  return <section className="soft-form-group contact-bank-accounts">
    <div className="inline-section-title"><strong>اطلاعات بانکی مخاطب</strong></div>
    {accounts.map((account, index) => <div className="contact-bank-account" key={account.id}>
      <div className="account-row-title"><span>بانک {index + 1}</span><button type="button" className="icon-btn danger-icon-btn" aria-label="حذف بانک" onClick={() => removeAccount(account.id)}><Trash2 size={17}/></button></div>
      <BottomSheetSelect label="نام بانک" value={account.bank} options={banks.map(item => item.title)} onChange={bank => updateAccount(account.id, { bank })}
        open={openSelect === `contact-bank-${account.id}`} onOpen={() => setOpenSelect(`contact-bank-${account.id}`)} onClose={() => setOpenSelect(null)}
        headerAction={<button type="button" className="sheet-add-option" onClick={onAddBank}>+ افزودن بانک</button>}
        optionIcon={getBankIcon}/>
      <Field label="شماره حساب" value={account.account || ''} onChange={event => updateAccount(account.id, { account: event.target.value })}/>
      <Field label="شماره کارت" value={account.card || ''} onChange={event => updateAccount(account.id, { card: event.target.value })}/>
      <Field label="شماره شبا" value={account.iban || ''} onChange={event => updateAccount(account.id, { iban: event.target.value })}/>
    </div>)}
    <button type="button" className="secondary-btn add-bank-account-btn" onClick={addAccount}><Plus size={17}/> افزودن بانک دیگر</button>
  </section>
}
function ContactDetail({ detail, onClose }) { return <Modal open={!!detail} title="اطلاعات کامل مخاطب" onClose={onClose}>{detail&&<div className="detail-list">{Object.entries(contactDetails(detail)).map(([key,value])=><div key={key}><span>{key}</span><strong>{value||'ثبت نشده'}</strong></div>)}</div>}</Modal> }
function LocalDataNotice({ onReset }) { return <section className="privacy-section"><div className="privacy-hero"><ShieldCheck/><div><strong>داده‌های شما خصوصی می‌ماند</strong><span>تمام اطلاعات فقط در مرورگر شما ذخیره می‌شود.</span></div></div><button onClick={onReset}><RotateCcw size={17}/> بازنشانی اطلاعات نمونه</button></section> }

function AppLockSection({ data, updateData }) {
  const [passcode, setPasscode] = useState('')
  const [message, setMessage] = useState('')
  const [durationOpen, setDurationOpen] = useState(false)
  const lock = data.lockSettings || {}
  const save = async event => {
    event.preventDefault()
    if (!/^\d{4}$/.test(passcode)) return setMessage('رمز باید دقیقاً چهار رقم باشد.')
    const passcodeHash = await hashPasscode(passcode)
    updateData(current => ({ ...current, lockSettings: { ...current.lockSettings, enabled: true, passcodeHash } }))
    localStorage.setItem('personal-finance-last-active', String(Date.now())); setPasscode(''); setMessage('رمز ذخیره شد.')
  }
  const registerBiometric = async () => {
    if (!window.PublicKeyCredential) return
    try {
      const credential = await navigator.credentials.create({ publicKey: { challenge: crypto.getRandomValues(new Uint8Array(32)), rp: { name: 'میرزا' }, user: { id: crypto.getRandomValues(new Uint8Array(16)), name: 'local-user', displayName: 'کاربر محلی' }, pubKeyCredParams: [{ alg: -7, type: 'public-key' }], authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' }, timeout: 60000 } })
      updateData(current => ({ ...current, lockSettings: { ...current.lockSettings, biometricCredentialId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))) } })); setMessage('اثر انگشت/قفل دستگاه ثبت شد.')
    } catch { setMessage('ثبت احراز هویت دستگاه انجام نشد.') }
  }
  return <section className="settings-section lock-settings"><div className="settings-intro"><span className="settings-intro-icon"><LockKeyhole/></span><div><h2>قفل برنامه</h2><p>این قفل برای نمونه محلی است و امنیت بانکی ندارد.</p></div></div><form onSubmit={save} className="form-grid"><Field label="رمز چهار رقمی" value={passcode} onChange={event => setPasscode(event.target.value.replace(/\D/g, '').slice(0,4))}/><BottomSheetSelect label="زمان قفل خودکار" value={lock.autoLock || 'فوری'} options={['فوری','بعد از ۱ دقیقه','بعد از ۵ دقیقه','بعد از ۱۵ دقیقه','بعد از ۳۰ دقیقه']} onChange={autoLock => updateData(current => ({ ...current, lockSettings: { ...current.lockSettings, autoLock } }))} open={durationOpen} onOpen={() => setDurationOpen(true)} onClose={() => setDurationOpen(false)}/><button className="primary-btn">ذخیره یا تغییر رمز</button></form><button className="secondary-btn biometric-btn" disabled={!window.PublicKeyCredential} onClick={registerBiometric}>باز کردن با اثر انگشت</button>{!window.PublicKeyCredential && <p className="settings-note">در این مرورگر یا دستگاه پشتیبانی نمی‌شود</p>}<button className="danger-zone" onClick={() => updateData(current => ({ ...current, lockSettings: { ...current.lockSettings, enabled: false } }))}>غیرفعال کردن قفل</button>{message && <p className="settings-note">{message}</p>}</section>
}

function NotificationSettings({ data, updateData }) {
  const enable = async () => {
    const permission = 'Notification' in window ? await Notification.requestPermission() : 'denied'
    updateData(current => ({ ...current, notificationSettings: { ...current.notificationSettings, enabled: permission === 'granted' } }))
  }
  return <section className="settings-section"><div className="settings-intro"><span className="settings-intro-icon"><Bell/></span><div><h2>اعلان‌ها</h2><p>اعلان بدهی‌های عقب‌افتاده پس از یک روز</p></div></div><button className="primary-btn notification-enable" onClick={enable}>فعال‌کردن اعلان مرورگر</button><p className="settings-note">اگر دسترسی رد شود، اعلان‌ها همچنان داخل برنامه نمایش داده می‌شوند.</p></section>
}

function AboutMirzaPage() {
  const features = [
    'ثبت درآمد و هزینه‌ها',
    'مدیریت حساب‌ها و کیف پول‌ها',
    'دسته‌بندی تراکنش‌ها',
    'مدیریت بودجه',
    'گزارش‌ها و نمودارهای مالی',
    'پیگیری پس‌انداز و اهداف مالی',
    'رابط کاربری فارسی و راست‌چین',
    'طراحی مدرن و بهینه برای استفاده روزمره',
  ]
  return <section className="about-page">
    <div className="about-hero">
      <div className="about-logo-wrap"><img src={APP_LOGO_PATH} alt={APP_NAME}/></div>
      <strong>{APP_NAME}</strong>
      <span>نسخه 1.0</span>
    </div>
    <AboutCard icon={Info} title="درباره میرزا">
      <p>میرزا یک اپلیکیشن مدیریت مالی شخصی است که با هدف ساده‌سازی مدیریت درآمد، هزینه‌ها، بودجه، پس‌انداز و دارایی‌های کاربران طراحی شده است.</p>
      <p>این برنامه به شما کمک می‌کند تا با ثبت و تحلیل تراکنش‌های روزانه، دید بهتری نسبت به وضعیت مالی خود داشته باشید و تصمیم‌های آگاهانه‌تری برای آینده مالی خود بگیرید.</p>
      <p>میرزا تلاش می‌کند تجربه‌ای ساده، سریع و قابل اعتماد برای مدیریت امور مالی شخصی فراهم کند؛ به‌گونه‌ای که کاربران بدون پیچیدگی بتوانند وضعیت مالی خود را مشاهده، تحلیل و برنامه‌ریزی کنند.</p>
    </AboutCard>
    <AboutCard icon={Sparkles} title="امکانات">
      <ul>{features.map(feature => <li key={feature}>{feature}</li>)}</ul>
    </AboutCard>
    <AboutCard icon={Target} title="چشم‌انداز">
      <p>هدف میرزا این است که مدیریت مالی شخصی را برای همه افراد ساده‌تر، شفاف‌تر و هوشمندتر کند و به کاربران کمک کند عادت‌های مالی بهتری ایجاد کنند.</p>
      <p>در نسخه‌های آینده امکانات بیشتری برای تحلیل مالی، مدیریت دارایی‌ها، شخصی‌سازی و یکپارچه‌سازی با سرویس‌های مختلف به برنامه اضافه خواهد شد.</p>
    </AboutCard>
    <AboutCard icon={ShieldCheck} title="امنیت و حریم خصوصی">
      <p>حفظ حریم خصوصی و امنیت اطلاعات مالی کاربران یکی از اصول اصلی توسعه میرزا است.</p>
      <p>اطلاعات شخصی کاربران تنها برای ارائه خدمات برنامه مورد استفاده قرار می‌گیرد و توسعه برنامه همواره با رعایت اصول امنیت اطلاعات و حفظ حریم خصوصی انجام می‌شود.</p>
    </AboutCard>
    <AboutCard icon={Code2} title="توسعه‌دهنده">
      <p><strong>تیم میرزا</strong></p>
      <p>طراحی‌شده با عشق برای مدیریت مالی بهتر.</p>
    </AboutCard>
    <div className="about-footer">
      <span>Version {APP_VERSION}</span>
      <span>Build 1</span>
      <span>© 2026 Mirza</span>
      <small>All rights reserved.</small>
    </div>
  </section>
}

function AboutCard({ icon: Icon, title, children }) {
  return <article className="about-card">
    <div className="about-card-head"><span><Icon size={18}/></span><h2>{title}</h2></div>
    <div className="about-card-body">{children}</div>
  </article>
}
