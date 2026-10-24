import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import AccountCredentialsForm from '../../app/components/account/AccountCredentialsForm.vue'

function mountForm(
  props: Partial<{
    isSubmitting: boolean
    mode: 'register' | 'sign-in'
    isThai: boolean
  }> = {},
) {
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
  it('rejects malformed email and associates the error with its input', async () => {
    const wrapper = await mountForm()
    await wrapper.get('input[name="email"]').setValue('invalid-email')
    await wrapper.get('input[name="password"]').setValue('correct horse')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.get('#email-error').text()).toBe(
      'Enter a valid email address.',
    )
    expect(
      wrapper.get('input[name="email"]').attributes('aria-describedby'),
    ).toBe('email-error')
  })

  it('keeps hints and errors out of the field labels', async () => {
    const wrapper = await mountForm({ mode: 'register' })
    const email = wrapper.get('input[name="email"]')
    const password = wrapper.get('input[name="password"]')

    expect(wrapper.find('label input').exists()).toBe(false)
    expect(wrapper.get(`label[for="${email.attributes('id')}"]`).text()).toBe(
      'Email',
    )
    expect(
      wrapper.get(`label[for="${password.attributes('id')}"]`).text(),
    ).toBe('Password')
    expect(password.attributes('aria-describedby')).toBe('password-hint')

    await email.setValue('invalid-email')
    await password.setValue('1234567')
    await wrapper.get('form').trigger('submit')
    expect(password.attributes('aria-describedby')).toBe('password-error')
    expect(wrapper.find('label p').exists()).toBe(false)
  })

  it.each([false, true])(
    'requires eight characters for registration (Thai: %s)',
    async (isThai) => {
      const wrapper = await mountForm({ mode: 'register', isThai })
      await wrapper.get('input[name="email"]').setValue('somsri@example.com')
      await wrapper.get('input[name="password"]').setValue('1234567')
      await wrapper.get('form').trigger('submit')
      expect(wrapper.emitted('submit')).toBeUndefined()
      expect(wrapper.get('#password-error').text()).toBe(
        isThai
          ? 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'
          : 'Use at least 8 characters for your password.',
      )
      expect(
        wrapper.get('input[name="password"]').attributes('aria-invalid'),
      ).toBe('true')
      await wrapper.get('input[name="password"]').setValue('12345678')
      expect(wrapper.find('#password-error').exists()).toBe(false)
      await wrapper.get('form').trigger('submit')
      expect(wrapper.emitted('submit')).toEqual([
        [{ email: 'somsri@example.com', password: '12345678' }],
      ])
    },
  )

  it('does not apply registration password length rules to sign-in', async () => {
    const wrapper = await mountForm()
    await wrapper.get('input[name="email"]').setValue('somsri@example.com')
    await wrapper.get('input[name="password"]').setValue('short')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('submit')).toEqual([
      [{ email: 'somsri@example.com', password: 'short' }],
    ])
  })
  it('keeps the submit button enabled and asks for missing fields inline', async () => {
    const wrapper = await mountForm()
    const button = wrapper.get('button[type="submit"]')

    expect(button.attributes('disabled')).toBeUndefined()

    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.text()).toContain('Enter your email address to continue.')
    expect(wrapper.text()).toContain('Enter your password to continue.')
    expect(wrapper.get('input[name="email"]').attributes('aria-invalid')).toBe(
      'true',
    )

    await wrapper.get('input[name="email"]').setValue('   ')
    await wrapper.get('input[name="password"]').setValue('correct horse')
    await wrapper.get('form').trigger('submit')
    // A whitespace-only email still counts as missing.
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('clears a field error once the respondent types in it', async () => {
    const wrapper = await mountForm()
    await wrapper.get('form').trigger('submit')
    expect(wrapper.find('#email-error').exists()).toBe(true)

    await wrapper.get('input[name="email"]').setValue('somsri@example.com')
    expect(wrapper.find('#email-error').exists()).toBe(false)
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
