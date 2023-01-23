export default function Home() {
    // This will bring all properties defined in the tag
    let self = this;
    // Custom HTML components has the self.value as default
    return `<h1>{{self.value}}</h1>`;
}
