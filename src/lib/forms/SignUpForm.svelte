<script>
  import Input from '$lib/components/Input.svelte'
  import { classNames } from '$lib/utils'
  import { createFields, enableErrors, disableErrors, isValid } from '$lib/forms'
  import { auth, user, db } from '$lib/firebase'
  import { goto } from '$app/navigation'
  import Brand from '$lib/components/Brand.svelte'
  import { alert } from '$lib/stores'
  import { doc, getDoc, setDoc } from 'firebase/firestore'
  import { customAlphabet } from 'nanoid'

  let formEl
  let disabled = false
  let showValidation = false
  let fields = {
    default: createFields.text('firstName', 'lastName', 'email', 'password', 'confirmPassword')
  }
  function handleSubmit() {
    showValidation = true
    if (isValid(formEl)) {
      if (fields.default.password.value === fields.default.confirmPassword.value) {
        disabled = true
        const firstName = fields.default.firstName.value.trim()
        const lastName = fields.default.lastName.value.trim()
        auth
          .signUp(fields.default.email.value, fields.default.password.value, {
            displayName: `${firstName} ${lastName}`
          })
          .then(async () => {
            await user.loaded()
            getDoc(doc($db, 'meta', 'ids')).then(res => {
              const ids = res.exists() ? res.data() : {}
              const alphabet = '0123456789'
              const nanoid = customAlphabet(alphabet, 7)
              let id = ''
              for (let i = 0; i < 100; ++i) {
                if (ids[nanoid()] === undefined) {
                  id = nanoid()
                  break
                }
              }
              if (id === '') {
                return alert.trigger('error', 'Too many collisions. Please try again.', false)
              } else {
                setDoc(
                  doc($db, 'meta', 'ids'),
                  {
                    [id]: id
                  },
                  { merge: true }
                ).then(() => {
                  setDoc(doc($db, 'users', $user.uid), {
                    id,
                    role: 'applicant',
                    firstName,
                    lastName
                  }).then(() => {
                    fields = disableErrors.allSections(fields)
                    goto('/')
                  })
                })
              }
            })
          })
          .catch(err => {
            fields = enableErrors.allSections(fields)
            disabled = false
            alert.trigger('error', err.code)
          })
      } else {
        fields.default = enableErrors.atSection(fields.default, 'password', 'confirmPassword')
        alert.trigger('error', 'Passwords do not match.', false)
      }
    }
  }
</script>

<form
  class={classNames('max-w-lg w-full', showValidation && 'show-validation')}
  bind:this={formEl}
  on:submit|preventDefault={handleSubmit}
  novalidate
>
  <fieldset class="grid gap-2" {disabled}>
    <Brand />
    <h1 class="text-2xl mt-1 font-bold">Sign up</h1>
    <div class="grid sm:grid-cols-2 gap-2 sm:gap-4">
      <Input
        type="text"
        bind:field={fields.default.firstName}
        placeholder="First name"
        floating
        required
      />
      <Input
        type="text"
        bind:field={fields.default.lastName}
        placeholder="Last name"
        floating
        required
      />
    </div>
    <Input type="email" bind:field={fields.default.email} placeholder="Email" floating required />
    <Input
      type="password"
      bind:field={fields.default.password}
      placeholder="New password"
      floating
      required
      autocomplete="new-password"
    />
    <Input
      type="password"
      bind:field={fields.default.confirmPassword}
      placeholder="Confirm password"
      floating
      required
      autocomplete="new-password"
    />
    <div class="flex items-center justify-between mt-2">
      <div>
        <a class="link" href="/signin">Need to sign in?</a>
      </div>
      <button
        class="shadow-sm rounded-md bg-blue-100 px-4 py-2 text-blue-900 hover:bg-blue-200 transition-colors duration-300 disabled:text-blue-500 disabled:bg-blue-200"
        type="submit"
      >
        Sign up
      </button>
    </div>
  </fieldset>
</form>
