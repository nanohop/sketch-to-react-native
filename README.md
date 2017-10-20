# Convert Sketch files to React Native components

* Sketch App: https://www.sketchapp.com/
* React Native: https://facebook.github.io/react-native/

Do you have designs in Sketch, and need to turn those into a mobile app?  This will take those designs, and automatically create React Native components.

![Sketch to React Native](images/sketch_to_react_native.png?raw=true)

## Want to try it without installing everything?

Send me your Sketch file and instructions, and I'll run it and email the output back to you: chris@nanohop.com

## Want to collaborate?

[Join us on Slack!](https://join.slack.com/t/design-to-code/shared_invite/enQtMjU5MzQ2OTAzNDEzLWE1MjUzMWVhNzVlNTFlZTFmYmRjODNkNDZmMDI1M2NhMTcwZjgwM2Q5M2Q3OTk5YmNhNTI5MDRmZDk5NmY1MWY)

## Want this as a service?

We offer that!  We also offer a **human in the loop**, where we'll clean up the output before it goes back to you.  Send me an email to learn more: chris@nanohop.com

*****

# Getting started

### Prerequisites:

* Node 8.5.0+ https://nodejs.org/en/
* Python 3.6.1+ https://www.python.org/downloads/
* Install TensorFlow https://www.tensorflow.org/install/

### Steps to run:

```bash
> git clone git@github.com:nanohop/sketch-to-react-native.git
> cd sketch-to-react-native
> npm install && npm link
> sketch-to-react-native ~/Desktop/myfile.svg
```

### Extract the component from Sketch as an SVG:

![Export Instructions](images/export_instructions.png?raw=true)

![Export Instructions 2](images/export_instructions_2.png?raw=true)

### Use that SVG file as the argument for convert.js

```bash
> sketch-to-react-native input-file.svg
```

It will run and save the output to the ./output folder.  Make sure to grab both the .js file, and the associated _images_ folder!  Drop that into your React Native application, and see the magic!

## What if it doesn't work?

Please let me know!  This is early software, and I'm trying to solve as many edge cases as I can find.  Please file an issue or send me an email.

# Conversion process

Sketch exports a fairly clean SVG, which makes the process easier, but there is still a lot of processing involved.  Here's the basic steps:

1. Prep the SVG to make processing easier
2. Use a deep neural net to filter out unwanted elements
3. Get component bounding boxes using headless Chrome
4. Figure out all the child/parent relationships
5. Convert from absolute (pixel) positioning to Flex Box
6. Extract images from SVG paths and polygons
7. Generate styles for every component
8. Generate components
9. Export to an output file


### A note about the most difficult part

Sketch (and the SVG export) is a pixel based (absolute positioned) system - but that's no good for React Native.  One of the primary difficulties was figuring out what the proper parent / sibling relationships were between all the components, and then converting from absolute positioning to flexBox.  There is still some work to clean this part up, but in general it's working fairly well for most inputs.

This also means that components in Sketch can _partially_ overlap - which doesn't do well during the conversion process.  I'm working on a fix for that; but until then - you'll get best results if there are no partially overlapping components in your Sketch file.  (Fully overlapping is fine - those will get properly converted to a parent => child relationship)

# FAQ

## Didn't Airbnb already release something that does this?

Nope! You're probably thinking of [react-sketchapp](https://github.com/airbnb/react-sketchapp) that takes react components, and generates Sketch files.  This goes the opposite direction: it takes Sketch files, and creates React Native components.


## Why React Native (mobile)?  Why not React (web)?

I started with mobile because the app designs for mobile are generally more straightforward, with less variation - so it was easier to make the first version.  I'm planning to do React for web as well though!  Send me an email if you'd like updates when it's available: chris@nanohop.com


## Is the generated code any good?

I'm a mobile developer myself - and we're rightfully fearful of any generated code.  It is really high on my priority list to keep the output as clean and readable as possible.  It's not perfect all the time, but it is one of my top priorities.


## How much time does this save?

I've found that screens that would normally take me about an hour to create, take as little as 10 minutes - so that's as much as 80% time savings!  The output does have to be cleaned up a little bit generally, but I find it usually provides good starting point.


## Why use headless Chrome?

It seems like overkill, but headless Chrome has a great SVG rendering engine, and it was the easiest way to get bounding boxes to work, and to export the SVG assets as pngs.  That will probably change in the future.


## Is there a way to try this out without installing everything?

I plan to get a hosted version up at some point, but until then you can email me your Sketch file and instructions, and I'll run it and email the component back to you: chris@nanohop.com


## What can't it do yet?

This is a work in progress, so there are a few things it doesn't do well: overlapping components, reusing component styles, reusing common components, collapsing unnecessary wrapping Views, (and more).  I have a long roadmap of features to add.


## Is there a Sketch plugin to do this automatically?

Not yet, but it's on the roadmap!


## How can I help?

If you'd like to help, I'd love to have you involved!  Feel free to file issues, or send me an email with any Sketch file that doesn't work quite right, and I'll also review and merge pull requests as well.



# Example


![Sketch to React Native conversion example](images/sketch_conversion.png?raw=true "Example Conversion")


You can see that it's not perfect - but it provides a really good starting point, and it's getting better all the time!


## Here's the generated code:



```javascript

import React, { Component } from 'react';

import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image
} from 'react-native';

import BackArrow from './Log_In_Page_images/Back-Arrow.png'
import Logo from './Log_In_Page_images/Logo.png'

export default class Main extends Component {

  render() {
    return (
      <ScrollView style={{
        flex: 1, alignSelf: 'stretch', 
        paddingTop: 20,
        backgroundColor: '#5CC5F8'}}>
        <View style={styles.Base}>
          <Image source={BackArrow} style={styles.BackArrow} />
          <Image source={Logo} style={styles.Logo} />
          <View style={styles.EmailInput}>
            <Text style={styles.EmailAddress}>Email Address</Text>
          </View>
          <View style={styles.PasswordInput}>
            <Text style={styles.Passsord}>Password</Text>
          </View>
          <View style={styles.LoginButton}>
            <Text style={styles.LogIn}>Log In</Text>
          </View>
        </View>
      </ScrollView>
    )
  }

}

const styles = StyleSheet.create({
  Base: {
    height: 680,
    backgroundColor: '#5CC5F8',
    borderRadius: 6,
    paddingTop: 20,
    paddingBottom: 122
  },
  BackArrow: {
    alignSelf: 'flex-start',
    marginLeft: 18
  },
  Logo: {
    alignSelf: 'center',
    marginTop: 25
  },
  EmailInput: {
    height: 64,
    backgroundColor: '#FAFAFA',
    borderRadius: 6,
    alignSelf: 'center',
    marginTop: 49,
    width: 292,
    alignItems: 'flex-start',
    marginLeft: 30,
    justifyContent: 'center'
  },
  EmailAddress: {
    backgroundColor: 'transparent',
    fontSize: 18,
    fontWeight: '300',
    color: '#444444',
    textAlign: 'left',
    marginLeft: 30
  },
  PasswordInput: {
    height: 64,
    backgroundColor: '#FAFAFA',
    borderRadius: 6,
    alignSelf: 'center',
    marginTop: 14,
    width: 292,
    alignItems: 'flex-start',
    marginLeft: 30,
    justifyContent: 'center'
  },
  Passsord: {
    backgroundColor: 'transparent',
    fontSize: 18,
    fontWeight: '300',
    color: '#444444',
    textAlign: 'left',
    marginLeft: 30
  },
  LoginButton: {
    height: 64,
    backgroundColor: '#332AC6',
    borderRadius: 6,
    alignSelf: 'center',
    marginTop: 121,
    width: 292,
    alignItems: 'center',
    justifyContent: 'center'
  },
  LogIn: {
    backgroundColor: 'transparent',
    fontSize: 24,
    fontWeight: '300',
    color: '#FFFFFF',
    textAlign: 'center'
  }
})


```



