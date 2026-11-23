import com.github.gradle.node.npm.task.NpmTask
import java.io.IOException

plugins {
    bluemap.java
    alias ( libs.plugins.node.gradle )
}

dependencies {
    api ( project( ":core" ) )

    api ( libs.adventure.api )
    api ( libs.bluecommands.core )

    compileOnly ( libs.bluecommands.brigadier )
    compileOnly ( libs.brigadier )
}

node {
    version = "20.14.0"
    download = true
    nodeProjectDir = file("webapp/")
    npmInstallCommand = "ci"
}

tasks.register("buildWebapp", type = NpmTask::class) {
    dependsOn ("npmInstall")
    args = listOf("run", "build")

    inputs.dir("webapp/")
    outputs.dir("webapp/dist/")
}

tasks.register("buildRenderer", type = NpmTask::class) {
    dependsOn ("npmInstall")
    args = listOf("run", "build:renderer")

    inputs.dir("webapp/src/")
    inputs.file("webapp/package.json")
    inputs.file("webapp/package-lock.json")
    inputs.file("webapp/vite.renderer.config.js")
    outputs.dir("webapp/dist-renderer/")
}

tasks.register("zipRenderer", type = Zip::class) {
    dependsOn ("buildRenderer")
    from (fileTree("webapp/dist-renderer/"))
    archiveFileName = "bluemap-${project.version}-renderer.zip"
    destinationDirectory = releaseDirectory

    inputs.dir("webapp/dist-renderer/")
    outputs.file(releaseDirectory.resolve("bluemap-${project.version}-renderer.zip"))
}

tasks.register("zipWebapp", type = Zip::class) {
    dependsOn ("buildWebapp")
    from (fileTree("webapp/dist/"))
    archiveFileName = "webapp.zip"
    destinationDirectory = file("src/main/resources/de/bluecolored/bluemap/")

    val replacements = mapOf(
        "version" to project.version
    )

    inputs.properties(replacements)
    inputs.dir("webapp/dist/")
    outputs.file("src/main/resources/de/bluecolored/bluemap/webapp.zip")

    filesMatching(listOf(
        "index.html",
    )) { expand(properties) }
}

tasks.processResources {
    dependsOn("zipWebapp")
}

tasks.getByName("sourcesJar") {
    dependsOn("zipWebapp")
}

tasks.register<CopyFileTask>("release") {
    group = "publishing"
    dependsOn("zipWebapp", "zipRenderer")

    inputFile = tasks.getByName("zipWebapp").outputs.files.singleFile
    outputFile = releaseDirectory.resolve("bluemap-${project.version}-webapp.zip")
}

tasks.clean {
    doFirst {
        if (!file("webapp/dist/").deleteRecursively())
            throw IOException("Failed to delete build directory!")
        if (!file("webapp/dist-renderer/").deleteRecursively())
            throw IOException("Failed to delete renderer build directory!")
    }
}

publishing {
    publications {
        create<MavenPublication>("maven") {
            groupId = project.group.toString()
            artifactId = "bluemap-${project.name}"
            version = project.version.toString()

            from(components["java"])
        }
    }
}
