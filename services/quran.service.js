const ffmpeg = require("fluent-ffmpeg");
const { PassThrough } = require("stream");

const mergeMultipleAudioFiles = (inputFiles) => {
  return new Promise((resolve, reject) => {
    const command = ffmpeg();
    const bufferStream = new PassThrough();

    inputFiles.forEach((file) => {
      command.input(file);
    });

    let buffers = [];

    command
      .on("end", () => {
        const audioBuffer = Buffer.concat(buffers);
        resolve(audioBuffer);
      })
      .on("error", (err) => {
        reject(err);
      })
      .complexFilter([
        {
          filter: "concat",
          options: {
            n: inputFiles.length,
            v: 0,
            a: 1,
          },
        },
      ])
      .audioCodec("libmp3lame")
      .format("mp3")
      .pipe(bufferStream, { end: true });

    bufferStream.on("data", (chunk) => {
      buffers.push(chunk);
    });

    bufferStream.on("error", (err) => {
      reject(err);
    });
  });
};

module.exports = {
  mergeMultipleAudioFiles,
};
