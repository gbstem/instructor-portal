<script>
  import Card from '$lib/components/Card.svelte'
  import { getDoc, doc } from 'firebase/firestore'
  import { fade } from 'svelte/transition'
  import { user, db } from '$lib/firebase'

  const formatTime = time => {
    if (
      time ===
      'saturday-2-30-4-30-pm-you-need-to-select-this-option-if-you-want-the-in-person-class'
    ) {
      return 'Saturday 2:30-4:30 PM'
    }
    let sentence = time.split('-').join(' ')
    // replace P M with PM
    sentence = sentence.replaceAll('p m', 'PM')
    // capitalize first letter of each word
    sentence = sentence.replace(/\b\w/g, l => l.toUpperCase())
    // for any there are 2 numbers separated by a space, separate by dash instead
    sentence = sentence.replace(/(\d{1,2}) (\d{1,2})/g, '$1-$2')
    return sentence
  }

  const getClasses = classes => {
    let data = {}
    const classIds = []
    for (const row of classes) {
      if (
        row.instructorUid === $user.uid ||
        row.instructor2Uid === $user.uid ||
        row.studentUid === $user.uid
      ) {
        classIds.push(row.classId)
      }
    }
    for (const row of classes) {
      if (classIds.includes(row.classId)) {
        if (data[row.classId]) {
          data[row.classId] = {
            ...data[row.classId],
            students: [
              ...data[row.classId].students,
              row.studentFirstName + ' ' + row.studentLastName
            ]
          }
        } else {
          data[row.classId] = {
            course: row.Course,
            instructorName: row.instructorName + ' (' + row.instructorEmail + ')',
            instructor2Name:
              row.instructor2Name !== ''
                ? row.instructor2Name + ' (' + row.instructor2Email + ')'
                : '',
            timeslot: row.Time,
            location:
              row.Loc === 'CPL Main Branch0' || row.Loc === 'CPL Main Branch'
                ? 'CPL Main Branch'
                : row.meetingLink,
            students: [row.studentFirstName + ' ' + row.studentLastName]
          }
        }
      }
    }
    return data
  }

  const asyncData = new Promise((resolve, reject) => {
    let data = {
      course: '',
      instructors: [],
      students: []
    }
    user.loaded().then(() => {
      // get classes doc
      getDoc(doc($db, 'classes', 'classes')).then(doc => {
        if (doc.exists()) {
          data = getClasses(doc.data().classes)
          resolve(data)
        } else {
          resolve(data)
        }
      })
    })
  })
</script>

{#await asyncData then data}
  <div class="grid grid-cols-2" transition:fade|local={{ duration: 150 }}>
    {#if data && Object.keys(data).length > 0}
      {#each Object.entries(data) as [key, singleClass]}
        <Card>
          <div class="text-lg font-bold">{singleClass.course}</div>
          <div class="text-sm text-gray-500">Location</div>
          <div>{singleClass.location}</div>
          <div class="text-sm text-gray-500">Time</div>
          <div>{formatTime(singleClass.timeslot)}</div>
          <div class="text-sm text-gray-500">Instructor(s)</div>
          <ul class="list-disc list-inside">
            <li>{singleClass.instructorName}</li>
            {#if singleClass.instructor2Name !== ''}
              <li>{singleClass.instructor2Name}</li>
            {/if}
          </ul>
          <div class="text-sm text-gray-500">Students</div>
          <ul class="list-disc list-inside">
            {#each singleClass.students as student}
              <li>{student}</li>
            {/each}
          </ul>
        </Card>
      {/each}
    {:else}
      <Card>
        <svelte:fragment slot="title">Class</svelte:fragment>
        <div class="text-sm text-gray-500">
          It seems like you're not teaching/enrolled in any class.
        </div>
      </Card>
    {/if}
  </div>
{:catch}
  <div>Error loading data. Please try again.</div>
{/await}
