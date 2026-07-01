import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import {
  CONTACT_SUGGESTION_SAVE_MODES,
  applyContactSuggestion,
  getContactSuggestionFields,
} from '../../../helpers/contacts.js'

const suggestion = overrides => ({
  title: 'مشتری پروژه',
  mobile: '09125556677',
  nationalId: '',
  bankAccount: {
    id: 'account-new',
    bank: 'بانک پاسارگاد',
    card: '5022291012345678',
    iban: 'IR450570000000987654321001',
    account: '',
  },
  ...overrides,
})

const existingContact = {
  id: 'contact-1',
  title: 'مشتری پروژه',
  type: 'کاری',
  mobile: '09120000000',
  nationalId: '0012345678',
  bank: 'بانک شهر',
  card: '6037997512341234',
  iban: '',
  account: '12345678',
  bankAccounts: [{ id: 'account-old', bank: 'بانک شهر', card: '6037997512341234', iban: '', account: '12345678' }],
  description: 'مخاطب قبلی',
}

test('contact suggestion fields show only entered values', () => {
  const fields = getContactSuggestionFields(suggestion({ mobile: '', bankAccount: { bank: '', card: '5022', iban: '', account: '' } }))

  assert.deepEqual(fields, [{ label: 'شماره کارت', value: '5022' }])
})

test('updating an existing financial contact merges entered information without creating duplicate contact', () => {
  const current = { financialContacts: [existingContact] }
  const next = applyContactSuggestion(current, suggestion(), CONTACT_SUGGESTION_SAVE_MODES.updateExisting, existingContact.id)

  assert.equal(next.financialContacts.length, 1)
  assert.equal(next.financialContacts[0].id, existingContact.id)
  assert.equal(next.financialContacts[0].mobile, '09125556677')
  assert.equal(next.financialContacts[0].nationalId, existingContact.nationalId)
  assert.equal(next.financialContacts[0].bankAccounts.length, 2)
})

test('saving as a new financial contact does not overwrite the existing matching contact', () => {
  const current = { financialContacts: [existingContact] }
  const next = applyContactSuggestion(current, suggestion(), CONTACT_SUGGESTION_SAVE_MODES.createNew, existingContact.id)

  assert.equal(next.financialContacts.length, 2)
  assert.equal(next.financialContacts[1].id, existingContact.id)
  assert.equal(next.financialContacts[1].mobile, existingContact.mobile)
  assert.equal(next.financialContacts[0].title, 'مشتری پروژه')
  assert.notEqual(next.financialContacts[0].id, existingContact.id)
})

test('contact suggestion bottom sheet has contact name row, vertical info list, toggle, and two main actions', () => {
  const source = readFileSync(new URL('../../../pages/RecordsPage.jsx', import.meta.url), 'utf8')
  const component = source.slice(source.indexOf('function ContactSuggestionModal'), source.indexOf('function PartialIncomeModal'))

  assert.equal(component.includes('contact-name-row'), true)
  assert.equal(component.includes('مخاطب مالی'), true)
  assert.equal(component.includes('contact-info-list'), true)
  assert.equal(component.includes('enteredInfoFields.map'), true)
  assert.equal(component.includes('contact-save-mode'), true)
  assert.equal(component.includes('به‌روزرسانی اطلاعات مخاطب'), true)
  assert.equal(component.includes('ثبت به عنوان مخاطب جدید'), true)
  assert.equal(component.includes('بازگشت'), true)
  assert.equal(component.includes('ذخیره اطلاعات'), true)
  assert.equal(component.includes('disabled={!canSave}'), true)
  assert.equal((component.match(/<button/g) || []).length, 2)
})

