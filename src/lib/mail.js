import Handlebars from 'handlebars'

export const templates = {
  applicationSubmitted: input => ({
    subject: 'Your application was successfully submitted!',
    html: Handlebars.compile(
      'Hello <p>{{firstName}}</p>! Congrats on your submitting your application! It is in review, and we will contact you shortly when we have made a decision.'
    )(input)
  })
}
