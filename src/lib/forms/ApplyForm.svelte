<script>
  import { classNames } from '$lib/utils'
  import { doc, getDoc, setDoc, addDoc, collection } from 'firebase/firestore'
  import { db, user, storage } from '$lib/firebase'
  import Input from '$lib/components/Input.svelte'
  import Select from '$lib/components/Select.svelte'
  import {
    racesEthnicitiesJson,
    gendersJson,
    reasonsJson,
    frlpJson,
    parentEducationJson,
    timeSlotsJson,
    csCoursesJson,
    mathCoursesJson,
    engineeringCoursesJson,
    scienceCoursesJson,
    gradesJson
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
      'primaryEmail',
      'secondaryEmail',
      'studentFirstName',
      'studentLastName',
      'parentFirstName',
      'parentLastName',
      'phoneNumber',
      'dateOfBirth',
      'gender',
      'raceEthnicity',
      'frlp',
      'parentEducation',
      'address'
    ),
    academic: createFields.text('school', 'grade'),
    program: {
      ...createFields.text(
        'reason',
        'csCourse',
        'mathCourse',
        'engineeringCourse',
        'scienceCourse'
      ),
      ...createFields.group('timeSlots'),
      ...createFields.checkbox('inPerson')
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
      email: fields.personal.primaryEmail.value,
      firstName: fields.personal.parentFirstName.value,
      lastName: fields.personal.parentLastName.value
    }
    fields.personal.primaryEmail.value = $user.email
    fields.personal.parentFirstName.value = profileDocData.firstName
    fields.personal.parentLastName.value = profileDocData.lastName
    fields.meta.id.value = profileDocData.id
    fields.meta.uid.value = $user.uid
    if (
      temp.email !== fields.personal.primaryEmail.value ||
      temp.firstName !== fields.personal.parentFirstName.value ||
      temp.lastName !== fields.personal.parentLastName.value
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
          {`Parent Name: ${fields.personal.parentFirstName.value} ${fields.personal.parentLastName.value}`}
        </div>
        <div class="bg-gray-100 shadow-sm rounded-md px-3 py-2">
          {`Email: ${fields.personal.primaryEmail.value}`}
        </div>
        <div class="text-sm">
          Wrong name or email? Go to your <a class="link" href="/profile">profile</a> to update your
          information.
        </div>
      </Card>

      <!-- secondary email -->
      <Input
        type="email"
        bind:field={fields.personal.secondaryEmail}
        placeholder="Secondary email"
        floating
      />
      <Input
        type="tel"
        bind:field={fields.personal.phoneNumber}
        placeholder="Phone number"
        floating
        required
      />

      <!-- student first name -->
      <Input
        type="text"
        bind:field={fields.personal.studentFirstName}
        placeholder="Student first name"
        floating
        required
      />

      <!-- student last name -->
      <Input
        type="text"
        bind:field={fields.personal.studentLastName}
        placeholder="Student last name"
        floating
        required
      />

      <Input
        type="date"
        bind:field={fields.personal.dateOfBirth}
        placeholder="Student Date of birth"
        floating
        required
      />

      <div class="grid sm:grid-cols-2 gap-1 sm:gap-3">
        <Select
          bind:field={fields.personal.gender}
          placeholder="Student gender"
          sourceJson={gendersJson}
          floating
          required
        />
        <Select
          bind:field={fields.personal.raceEthnicity}
          name="race"
          autocomplete="race"
          placeholder="Student race or ethnicity"
          sourceJson={racesEthnicitiesJson}
          floating
          required
        />
      </div>

      <Select
        bind:field={fields.personal.frlp}
        placeholder="Eligible for federal free or reduced lunch program?"
        sourceJson={frlpJson}
        floating
        required
      />
      <Select
        bind:field={fields.personal.parentEducation}
        placeholder="Parent's highest level of education"
        sourceJson={parentEducationJson}
        floating
        required
      />

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
            placeholder="Student's current school"
            floating
            required
          />
        </div>
        <Select
          bind:field={fields.academic.grade}
          placeholder="Student Grade"
          sourceJson={gradesJson}
          floating
          required
        />
      </div>
    </div>
    <div class="grid gap-1">
      <span class="font-bold">Course Selection</span>
      <div class="mt-2">
        <Select
          bind:field={fields.program.csCourse}
          placeholder="CS course"
          sourceJson={csCoursesJson}
          floating
          required
        />
      </div>
      <div class="mt-2">
        <Select
          bind:field={fields.program.mathCourse}
          placeholder="Math course"
          sourceJson={mathCoursesJson}
          floating
          required
        />
      </div>
      <div class="mt-2">
        <Select
          bind:field={fields.program.engineeringCourse}
          placeholder="Engineering course"
          sourceJson={engineeringCoursesJson}
          floating
          required
        />
      </div>
      <div class="mt-2">
        <Select
          bind:field={fields.program.scienceCourse}
          placeholder="Science course"
          sourceJson={scienceCoursesJson}
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
        <Select
          bind:field={fields.program.reason}
          placeholder="How did you learn about gbSTEM?"
          sourceJson={reasonsJson}
          floating
          required
        />
      </div>

      <Input
        type="checkbox"
        bind:field={fields.program.inPerson}
        placeholder="gbSTEM will offer in-person classes at the Cambridge Public Library. Would you like to opt for the in-person option if available for your student? Note that we cannot guarantee that in-person classes will be available for all students."
      />
    </div>
    <div class="grid gap-1">
      <span class="font-bold">Agreements</span>
      <div class="grid">
        <Input
          type="checkbox"
          bind:field={fields.agreements.entireProgram}
          placeholder="gbSTEM will run from September 17th to December 17th. Will the student be able to participate throughout the entirety of the program?"
          required
        />

        <Input
          type="checkbox"
          bind:field={fields.agreements.timeCommitment}
          placeholder="Do you hereby confirm that the student can meet the gbSTEM weekly time commitment? Once you have registered for your courses, you will not be able to unenroll. Please understand that an unused spot for your child prevents others from joining or getting their preferred time slots. The time commitment for EACH course selected is at minimum 2 hours per week.  This means that if your student takes a computer science, math, and engineering course, the time commitment will be 6 hours a week. Students are not allowed to miss classes unless for medical reasons or family emergencies."
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
  </fieldset>
</form>
