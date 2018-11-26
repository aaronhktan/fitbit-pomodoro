function mySettings(props) {
  return (
    <Page>
      <Section
        description={<Text> Choose the duration of your sets here.</Text>}
        title={<Text bold align="center">Custom timings</Text>}>
        <Select
          title="Pomodoro duration"
          label="Pomodoro duration"
          settingsKey="pomodoro-duration"
          options={[
            {name:"10 minutes", value:10},
            {name:"15 minutes", value:15},
            {name:"20 minutes", value:20},
            {name:"25 minutes", value:25},
            {name:"30 minutes", value:30},
            {name:"35 minutes", value:35},
            {name:"40 minutes", value:40},
            {name:"45 minutes", value:45},
            // {name:"15 seconds", value:0.1},
          ]}
        />
        <Select
          title="Short break duration"
          label="Short break duration"
          settingsKey="short-rest-duration"
          options={[
            {name:"1 minute",   value:1},
            {name:"2 minutes",  value:2},
            {name:"3 minutes",  value:3},
            {name:"4 minutes",  value:4},
            {name:"5 minutes",  value:5},
            {name:"6 minutes",  value:6},
            {name:"7 minutes",  value:7},
            {name:"8 minutes",  value:8},
            {name:"9 minutes",  value:9},
            {name:"10 minutes", value:10},
            // {name:"15 seconds",  value:0.1},
          ]}
        />
        <Select
          title="Long break duration"
          label="Long break duration"
          settingsKey="long-rest-duration"
          options={[
            {name:"10 minutes", value:10},
            {name:"15 minutes", value:15},
            {name:"20 minutes", value:20},
            {name:"25 minutes", value:25},
            {name:"30 minutes", value:30},
            // {name:"15 seconds", value:0.2},
          ]}
        />
        <Toggle
          label="Continue on resume?"
          settingsKey="continue-on-resume"
        />
      </Section>
    </Page>
  );
}

registerSettingsPage(mySettings);