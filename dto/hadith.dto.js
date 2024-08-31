class HadithDto {
  constructor(data) {
    this.text = data?.text;
    this.book = data?.book;
    this.confirmed = data?.confirmed;
    this.hadithNumber = data?.hadithNumber;
    this.hadithsInBook = data?.hadithsInBook;
    this.id = data?._id;
    this.author = data?.author;
    this.published = data?.published;
    this.skipped = data?.skipped;
  }
}

module.exports = HadithDto;
