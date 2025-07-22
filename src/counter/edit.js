/**
 * Retrieves the translation of text.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-i18n/
 */
import { __ } from '@wordpress/i18n';

/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#useblockprops
 */
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	TextControl,
	TextareaControl,
	DatePicker
} from '@wordpress/components';
import ServerSideRender from '@wordpress/server-side-render';

export default function Edit( { attributes, setAttributes } ) {
	const {
		dateFrom,
		text,
	} = attributes;

	const blockProps = useBlockProps();

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Counter Settings', 'sunflower-map-points' ) }>

					<TextareaControl
						label={ __( 'Anzeigetext', 'sunflower-map-points' ) }
						value={ text }
						onChange={ ( value ) => setAttributes( { text: value } ) }
						help={ __( 'Platzhalter: %%COUNT%%, %%DATE%%', 'sunflower-map-points-counter' ) }
					/>

					<TextControl
						label={ __( 'Date (YYYY-MM-DD)', 'sunflower-map-points' ) }
						value={ dateFrom }
						placeholder="2024-01-01"
						onChange={ ( value ) =>
							setAttributes( { dateFrom: value } )
						}
						help={ __( 'Nur Hinweise nach diesem Datum zählen', 'sunflower-map-points-counter' ) }
					/>
					<DatePicker
						currentDate={ dateFrom }
						onChange={ ( date ) => setAttributes( { dateFrom: date.substring(0, 10) } ) }
					/>
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps }>
				<ServerSideRender
					block="sunflower-map-points/counter"
					attributes={ attributes }
				/>
			</div>
		</>
	);
}
