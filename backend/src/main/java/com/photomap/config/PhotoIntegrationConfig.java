package com.photomap.config;

import com.photomap.service.PhotoProcessingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.integration.annotation.InboundChannelAdapter;
import org.springframework.integration.annotation.Poller;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.integration.channel.DirectChannel;
import org.springframework.integration.config.EnableIntegration;
import org.springframework.integration.core.MessageSource;
import org.springframework.integration.file.FileReadingMessageSource;
import org.springframework.integration.file.filters.AbstractFileListFilter;
import org.springframework.integration.scheduling.PollerMetadata;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageHandler;
import org.springframework.messaging.MessagingException;
import org.springframework.scheduling.support.PeriodicTrigger;

import java.io.File;

@Configuration
@EnableIntegration
@RequiredArgsConstructor
@Slf4j
public class PhotoIntegrationConfig {

    private final PhotoProcessingService photoProcessingService;

    @Value("${photo.upload.directory.input}")
    private String inputDirectory;

    @Value("${photo.processing.poll.interval}")
    private long pollInterval;

    @Bean
    public MessageChannel photoInputChannel() {
        return new DirectChannel();
    }

    @Bean
    public MessageChannel errorChannel() {
        return new DirectChannel();
    }

    @Bean
    @InboundChannelAdapter(value = "photoInputChannel", poller = @Poller(fixedDelay = "${photo.processing.poll.interval}"))
    public MessageSource<File> fileReadingMessageSource() {
        FileReadingMessageSource source = new FileReadingMessageSource();
        source.setDirectory(new File(inputDirectory));

        AbstractFileListFilter<File> imageFilter = new AbstractFileListFilter<>() {
            @Override
            public boolean accept(File file) {
                String name = file.getName().toLowerCase();
                return name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png");
            }
        };

        source.setFilter(imageFilter);
        source.setAutoCreateDirectory(true);
        log.info("File reading message source initialized for directory: {}", inputDirectory);
        return source;
    }

    @Bean
    @ServiceActivator(inputChannel = "photoInputChannel")
    public MessageHandler photoProcessingHandler() {
        return message -> {
            File file = (File) message.getPayload();
            log.info("Received file for processing: {}", file.getName());
            photoProcessingService.processPhoto(file);
        };
    }

    @Bean
    @ServiceActivator(inputChannel = "errorChannel")
    public MessageHandler errorHandler() {
        return message -> {
            MessagingException exception = (MessagingException) message.getPayload();
            log.error("Error processing photo: {}", exception.getMessage(), exception);
        };
    }
}
