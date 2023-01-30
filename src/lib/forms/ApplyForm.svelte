<script>
  import { classNames } from '$lib/utils'
  import { doc, getDoc, setDoc, addDoc, collection } from 'firebase/firestore'
  import { db, user } from '$lib/firebase'
  import Input from '$lib/components/Input.svelte'
  import Select from '$lib/components/Select.svelte'
  import Textarea from '$lib/components/Textarea.svelte'
  import {
    racesEthnicitiesJson,
    gendersJson,
    reasonsJson,
    timeSlotsJson,
    coursesJson,
    classesPerWeekJson
  } from '$lib/data'
  import { createFields, serialize, isValid } from '$lib/forms'
  import { alert } from '$lib/stores'
  import { onMount } from 'svelte'
  import Card from '$lib/components/Card.svelte'
  import { templates } from '$lib/mail'

  let formEl
  let disabled = true
  let showValidation = false
  let fields = {
    personal: createFields.text(
      'email',
      'firstName',
      'lastName',
      'phoneNumber',
      'dateOfBirth',
      'gender',
      'raceEthnicity',
      'address'
    ),
    academic: createFields.text('school', 'graduationYear'),
    program: {
      ...createFields.text('reason', 'preferences', 'numClasses', 'notAvailable'),
      ...createFields.group('courses', 'timeSlots'),
      ...createFields.checkbox('inPerson')
    },
    essay: {
      ...createFields.text('academicBackground', 'teachingScenario', 'why')
    },
    agreements: createFields.checkbox('entireProgram', 'timeCommitment', 'submitting'),
    meta: {
      ...createFields.text('id'),
      ...createFields.text('uid'),
      ...createFields.checkbox('submitted')
    }
  }

  onMount(async () => {
    const applicationDoc = await getDoc(doc($db, 'applications', $user.uid))
    if (applicationDoc.exists()) {
      // comment this out when changing what data the application uses
      // i.e., structure of fields
      fields = serialize.fromServer(applicationDoc.data())
    }
    const profileDoc = await getDoc(doc($db, 'users', $user.uid))
    const profileDocData = profileDoc.data()
    const temp = {
      email: fields.personal.email.value,
      firstName: fields.personal.firstName.value,
      lastName: fields.personal.lastName.value
    }
    fields.personal.email.value = $user.email
    fields.personal.firstName.value = profileDocData.firstName
    fields.personal.lastName.value = profileDocData.lastName
    fields.meta.id.value = profileDocData.id
    fields.meta.uid.value = $user.uid
    if (
      temp.email !== fields.personal.email.value ||
      temp.firstName !== fields.personal.firstName.value ||
      temp.lastName !== fields.personal.lastName.value
    ) {
      handleSave(false)
    }
    if (!fields.meta.submitted.checked) {
      disabled = false
      const interval = setInterval(() => {
        if (!fields.meta.submitted.checked) {
          handleSave(false)
        }
      }, 300000)
      return () => clearInterval(interval)
    }
  })
  function handleSave(withDisabling) {
    showValidation = false
    if (withDisabling) {
      disabled = true
    }
    setDoc(doc($db, 'applications', $user.uid), serialize.toServer(fields))
      .then(() => {
        disabled = false
        alert.trigger('success', 'Your application was saved.')
      })
      .catch(err => {
        disabled = false
        alert.trigger('error', err.code)
      })
  }
  async function handleSubmit() {
    showValidation = true
    if (isValid(formEl)) {
      disabled = true
      let serializedFields = serialize.toServer(fields)
      serializedFields.meta.submitted.checked = true
      setDoc(doc($db, 'applications', $user.uid), serializedFields)
        .then(async () => {
          showValidation = false
          alert.trigger('success', 'Your application has been submitted!')
          const applicationDoc = await getDoc(doc($db, 'applications', $user.uid))
          fields = serialize.fromServer(applicationDoc.data())
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          })
          handleEmail()
        })
        .catch(err => {
          disabled = false
          alert.trigger('error', err.code)
        })
    } else {
      alert.trigger('error', 'Please fill all required fields correctly.', false)
    }
  }
  function handleEmail() {
    return addDoc(collection($db, 'mail'), {
      to: $user.email,
      message: templates.applicationSubmitted({
        firstName: fields.personal.firstName.value,
        lastName: fields.personal.lastName.value
      })
    })
  }
</script>

<form
  class={classNames('max-w-lg', showValidation && 'show-validation')}
  bind:this={formEl}
  on:submit|preventDefault={handleSubmit}
  novalidate
>
  <fieldset class="grid gap-6" {disabled}>
    <div class="grid gap-1">
      <span class="font-bold">Personal</span>
      <Card class="grid gap-3 my-2">
        <div class="bg-gray-100 shadow-sm rounded-md px-3 py-2">
          {`Name: ${fields.personal.firstName.value} ${fields.personal.lastName.value}`}
        </div>
        <div class="bg-gray-100 shadow-sm rounded-md px-3 py-2">
          {`Email: ${fields.personal.email.value}`}
        </div>
        <div class="text-sm">
          Wrong name or email? Go to your <a class="link" href="/profile">profile</a> to update your
          information.
        </div>
      </Card>

      <Input
        type="tel"
        bind:field={fields.personal.phoneNumber}
        placeholder="Phone number"
        floating
        required
      />

      <Input
        type="date"
        bind:field={fields.personal.dateOfBirth}
        placeholder="Date of birth"
        floating
        required
      />

      <div class="grid sm:grid-cols-2 gap-1 sm:gap-3">
        <Select
          bind:field={fields.personal.gender}
          placeholder="Gender"
          sourceJson={gendersJson}
          floating
          required
        />
        <Select
          bind:field={fields.personal.raceEthnicity}
          name="race"
          autocomplete="race"
          placeholder="Race or ethnicity"
          sourceJson={racesEthnicitiesJson}
          floating
          required
        />
      </div>

      <Input
        type="text"
        bind:field={fields.personal.address}
        placeholder="Address"
        floating
        required
      />
    </div>
    <div class="grid gap-1">
      <span class="font-bold">Academic</span>
      <div class="grid sm:grid-cols-3 gap-1 sm:gap-3">
        <div class="sm:col-span-2">
          <Input
            type="text"
            bind:field={fields.academic.school}
            placeholder="Current school"
            floating
            required
          />
        </div>
        <Input
          type="number"
          bind:field={fields.academic.graduationYear}
          placeholder="Graduation year"
          min={new Date().getFullYear()}
          max={new Date().getFullYear() + 20}
          floating
          required
        />
      </div>
    </div>
    <div class="grid gap-1">
      <div class="mt-3 grid gap-1">
        <span class="font-bold"
          >Which of the following courses are you comfortable teaching? Check all that apply. Course
          descriptions are on our website.</span
        >
        <div class="grid grid-cols-2 gap-2">
          {#each coursesJson as course}
            <Input type="checkbox" bind:group={fields.program.courses} placeholder={course.name} />
          {/each}
        </div>
      </div>

      <div class="mt-4">
        <span class="font-bold"
          >If you have any preferences for the courses you teach, please list them here.</span
        >
        <Input
          type="text"
          bind:field={fields.program.preferences}
          placeholder="Preferences"
          floating
        />
      </div>

      <div class="mt-4">
        <span class="font-bold"
          >How many classes would you be able to teach a week? Each class will meet for 2 hours a
          week.</span
        >
        <Select
          bind:field={fields.program.numClasses}
          placeholder="Num classes per week"
          sourceJson={classesPerWeekJson}
          floating
          required
        />
      </div>

      <div class="mt-3 grid gap-1">
        <span class="font-bold">Timeslots</span>
        <div class="grid grid-cols-2 gap-2">
          {#each timeSlotsJson as timeSlot}
            <Input
              type="checkbox"
              bind:group={fields.program.timeSlots}
              placeholder={timeSlot.name}
            />
          {/each}
        </div>
      </div>

      <div class="mt-2">
        <Textarea
          bind:field={fields.program.notAvailable}
          placeholder="When will you not be available to teach classes during the semester? Include potential conflicts such as medical absences, vacations, and athletic events."
          required
        />
      </div>

      <Input
        type="checkbox"
        bind:field={fields.program.inPerson}
        placeholder="gbSTEM will offer both virtual classes and in-person classes at the Cambridge Public Library. Check this box if you would be able to conduct in-person lessons."
      />

      <div class="mt-2">
        <Select
          bind:field={fields.program.reason}
          placeholder="How did you learn about gbSTEM?"
          sourceJson={reasonsJson}
          floating
          required
        />
      </div>

      <div class="mt-5">
        <span class="font-bold">Essays</span>
        <div class="mt-2">
          <Textarea
            bind:field={fields.essay.academicBackground}
            placeholder="Describe your academic background in any of the classes you said you were comfortable teaching. List any relevant coursework, projects, or extracurriculars. (max 150 words)"
            required
          />
        </div>
        <div class="mt-2">
          <Textarea
            bind:field={fields.essay.teachingScenario}
            placeholder="Suppose your students are not engaging in the class. What would you do? (max 150 words)"
            required
          />
        </div>
        <div class="mt-2">
          <Textarea
            bind:field={fields.essay.why}
            placeholder="Why do you want to teach for gbSTEM? (max 150 words)"
            required
          />
        </div>
      </div>
      <div class="grid gap-1">
        <span class="font-bold">Agreements</span>
        <div class="grid">
          <Input
            type="checkbox"
            bind:field={fields.agreements.entireProgram}
            placeholder="gbSTEM will run from March 5th to June 10th. Do you confirm that you will be able to teach for the entirety of the program?"
            required
          />

          <Input
            type="checkbox"
            bind:field={fields.agreements.timeCommitment}
            placeholder="Do you hereby confirm that if you are selected as an instructor, that you will be able to make the weekly time commitment of 2 hours a week for each class you teach? "
            required
          />
          <Input
            type="checkbox"
            bind:field={fields.agreements.submitting}
            placeholder="I understand submitting means I can no longer make changes to my application. Don't check this box until you are sure that you are ready to submit."
            required
          />
        </div>
      </div>
      <div class={classNames('grid gap-3', !fields.meta.submitted.checked && 'grid-cols-2')}>
        {#if fields.meta.submitted.checked}
          <div class="shadow-sm rounded-md bg-green-100 px-4 py-2 text-green-900 text-center">
            Application submitted and in review!
          </div>
        {:else}
          <button
            type="button"
            on:click={() => handleSave(true)}
            class="shadow-sm rounded-md bg-gray-100 px-4 py-2 text-gray-900 hover:bg-gray-200 transition-colors duration-300 disabled:text-gray-500 disabled:bg-gray-200"
            >Save draft</button
          >
          <button
            type="submit"
            class="shadow-sm rounded-md bg-blue-100 px-4 py-2 text-blue-900 hover:bg-blue-200 transition-colors duration-300 disabled:text-blue-500 disabled:bg-blue-200"
            >Submit</button
          >
        {/if}
      </div>
    </div>
  </fieldset>
</form>
