import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import AccountCredentialsForm from '../../app/components/account/AccountCredentialsForm.vue'

function mountForm(props: Partial<{ isSubmitting: boolean }> = {}) {
  return mountSuspended(AccountCredentialsForm, {
    props: {
      mode: 'sign-in',
      isSubmitting: false,
      error: null,
      isThai: false,
      ...props,
    },
  })
}

describe('account credentials form', () => {
  it('keeps the submit button disabled until both fields are filled', async () => {
    const wrapper = await mountForm()
    const button = wrapper.get('button[type="submit"]')

    expect(button.attributes('disabled')).toBeDefined()

    await wrapper.get('input[name="email"]').setValue('somsri@example.com')
    expect(button.attributes('disabled')).toBeDefined()

    await wrapper.get('input[name="password"]').setValue('correct horse')
    expect(button.attributes('disabled')).toBeUndefined()

    await wrapper.get('input[name="email"]').setValue('   ')
    expect(button.attributes('disabled')).toBeDefined()
  })

  it('stays disabled while submitting and says so', async () => {
    const wrapper = await mountForm({ isSubmitting: true })
    await wrapper.get('input[name="email"]').setValue('somsri@example.com')
    await wrapper.get('input[name="password"]').setValue('correct horse')

    const button = wrapper.get('button[type="submit"]')
    expect(button.attributes('disabled')).toBeDefined()
    expect(button.text()).toBe('Please wait…')

    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('emits the trimmed email and the password as typed on submit', async () => {
    const wrapper = await mountForm()
    await wrapper.get('input[name="email"]').setValue('  somsri@example.com ')
    await wrapper.get('input[name="password"]').setValue(' correct horse ')

    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')).toEqual([
      [{ email: 'somsri@example.com', password: ' correct horse ' }],
    ])
  })
})
