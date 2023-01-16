<script>
  import Card from '$lib/components/Card.svelte'
  import { getDoc, doc } from 'firebase/firestore'
  import { fade } from 'svelte/transition'
  import { user, db } from '$lib/firebase'

  const asyncData = new Promise((resolve, reject) => {
    let data = {
      course: '',
      instructors: [],
      students: []
    }
    user.loaded().then(() => {
      getDoc(doc($db, 'registrations', $user.uid)).then(res => {
        if (res.exists()) {
          const registration = res.data()
          const { classId } = registration
          getDoc(doc($db, 'classes', classId)).then(res => {
            if (res.exists()) {
              const classInfo = res.data()
              data.course = classInfo.course
              Object.keys(classInfo.instructors).forEach(instructorId => {
                instructors.push(classInfo.instructors[instructorId])
              })
              Object.keys(classInfo.students).forEach(studentId => {
                students.push(classInfo.students[studentId])
              })
            }
          })
        }
        resolve(data)
      })
    })
  })
</script>

{#await asyncData then data}
  <div class="grid grid-cols-2" transition:fade|local={{ duration: 150 }}>
    <Card>
      <svelte:fragment slot="title">Class</svelte:fragment>
      {#if data.class}
        <div class="text-lg font-bold">{data.course}</div>
        <div class="text-sm text-gray-500">Instructors</div>
        <ul class="list-disc list-inside">
          {#each data.instructors as instructor}
            <li>{instructor}</li>
          {/each}
        </ul>
        <div class="text-sm text-gray-500">Students</div>
        <ul class="list-disc list-inside">
          {#each data.students as student}
            <li>{student}</li>
          {/each}
        </ul>
      {:else}
        <div class="text-sm text-gray-500">No class found.</div>
      {/if}
    </Card>
  </div>
{:catch}
  <div>Error loading data. Please try again.</div>
{/await}
