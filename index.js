const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

const messagesFilePath = path.join(__dirname, 'messages.json');

const readMessages = () => {
  if (fs.existsSync(messagesFilePath)) {
    const data = fs.readFileSync(messagesFilePath);
    return JSON.parse(data);
  }
  return {};
};

const writeMessages = (messages) => {
  fs.writeFileSync(messagesFilePath, JSON.stringify(messages, null, 2));
};

let messages = readMessages();
const teachers = {};

const getTeacherData = (senderID) => {
  if (!teachers[senderID]) {
    teachers[senderID] = { name: `Teacher_${senderID}`, teaches: 0 };
  }
  return teachers[senderID];
};

app.get('/baby', (req, res) => {
  const { text, remove, list, edit, teach, reply, senderID, react, key, index } = req.query;

  if (text) {
    const messageReplies = messages[text.toLowerCase()] || [];
    const reply = messageReplies.length ? messageReplies[Math.floor(Math.random() * messageReplies.length)] : "I don't know what to say.";
    return res.json({ reply });
  }

  if (remove) {
    if (index) {
      const messageReplies = messages[remove.toLowerCase()];
      if (messageReplies && messageReplies[index]) {
        messageReplies.splice(index, 1);
        if (!messageReplies.length) delete messages[remove.toLowerCase()];
        writeMessages(messages);
        return res.json({ message: 'Reply removed successfully.' });
      }
      return res.json({ message: 'Reply not found.' });
    }
    delete messages[remove.toLowerCase()];
    writeMessages(messages);
    return res.json({ message: 'Message removed successfully.' });
  }

  if (list === 'all') {
    return res.json({ messages });
  }

  if (edit && reply) {
    const messageReplies = messages[edit.toLowerCase()];
    if (messageReplies) {
      messageReplies[0] = reply;
      writeMessages(messages);
      return res.json({ message: 'Reply edited successfully.' });
    }
    return res.json({ message: 'Message not found.' });
  }

  if (teach && reply) {
    const messageReplies = messages[teach.toLowerCase()] || [];
    messageReplies.push(...reply.split(',').map(r => r.trim()));
    messages[teach.toLowerCase()] = messageReplies;

    const teacher = getTeacherData(senderID);
    teacher.teaches += 1;
    writeMessages(messages);
    return res.json({ message: 'Replies added successfully.', teacher: senderID, teachs: teacher.teaches });
  }

  res.json({ message: 'Invalid request.' });
});

app.listen(port, () => {
  console.log(`API listening at http://localhost:${port}`);
});
