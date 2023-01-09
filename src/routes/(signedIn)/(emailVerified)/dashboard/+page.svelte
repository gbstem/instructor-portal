<script>
  import Card from '$lib/components/Card.svelte'
  import { getDoc, doc } from 'firebase/firestore'
  import { fade } from 'svelte/transition'
  import { user, db } from '$lib/firebase'

  const asyncData = new Promise((resolve, reject) => {
    let data = {
      application: '',
      group: {}
    }
    user.loaded().then(() => {
      getDoc(doc($db, 'applications', $user.uid)).then(res => {
        if (res.exists()) {
          const application = res.data()
          console.log(application)
          if (application.accepted) {
            data.application =
              'You have been accepted to gbSTEM 2023! We look forward to seeing you.'
          } else {
            data.application = application.submitted ? 'Submitted and in review!' : 'In progress.'
          }
        } else {
          data.application = 'Not started.'
        }
        resolve(data)
      })
    })
  })
</script>

{#await asyncData then data}
  <div class="grid grid-cols-2" transition:fade|local={{ duration: 150 }}>
    <Card>
      <svelte:fragment slot="title">Application</svelte:fragment>
      <div class="text-xl">{data.application}</div>
    </Card>
  </div>
{:catch}
  <div>Error loading data. Please try again.</div>
{/await}
